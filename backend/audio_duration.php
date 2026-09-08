<?php
/**
 * audio_duration.php
 *
 * Pure-PHP audio duration extraction — no external tools required.
 * Supports: MP3 (CBR + VBR/Xing), WAV (PCM/RIFF), OGG Vorbis.
 *
 * Usage:
 *   require_once __DIR__ . '/audio_duration.php';
 *   $seconds  = audio_duration_seconds('/abs/path/to/file.mp3');
 *   $formatted = audio_duration_format($seconds); // "3:42"
 */

/**
 * Return raw duration in seconds (float), or 0.0 on failure.
 */
function audio_duration_seconds(string $filePath): float {
    if (!is_readable($filePath)) return 0.0;

    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

    switch ($ext) {
        case 'mp3':
            return _mp3_duration($filePath);
        case 'wav':
            return _wav_duration($filePath);
        case 'ogg':
            return _ogg_duration($filePath);
        default:
            return 0.0;
    }
}

/**
 * Format seconds into "M:SS" string (e.g. "3:07").
 */
function audio_duration_format(float $seconds): string {
    if ($seconds <= 0) return '0:00';
    $s = (int)round($seconds);
    return (int)floor($s / 60) . ':' . str_pad($s % 60, 2, '0', STR_PAD_LEFT);
}

// ──────────────────────────────────────────────
// MP3
// ──────────────────────────────────────────────
function _mp3_duration(string $file): float {
    $fh = @fopen($file, 'rb');
    if (!$fh) return 0.0;
    $size = filesize($file);

    // Skip ID3v2 tag if present
    $header = fread($fh, 10);
    $offset = 0;
    if (strlen($header) >= 10 && substr($header, 0, 3) === 'ID3') {
        // Syncsafe integer for size (bytes 6–9)
        $rawSize  = unpack('N', $header[6] . $header[7] . $header[8] . $header[9])[1];
        $id3Size  = (($rawSize & 0x7F000000) >> 3)
                  | (($rawSize & 0x007F0000) >> 2)
                  | (($rawSize & 0x00007F00) >> 1)
                  |  ($rawSize & 0x0000007F);
        // Add 10-byte header, plus footer if flagged
        $hasFooter = (ord($header[5]) & 0x10) ? 10 : 0;
        $offset = 10 + $id3Size + $hasFooter;
    }

    // Subtract ID3v1 tag from tail (128 bytes)
    fseek($fh, -128, SEEK_END);
    $tail = fread($fh, 3);
    $audioEnd = ($tail === 'TAG') ? ($size - 128) : $size;

    // Seek to first MPEG frame sync
    fseek($fh, $offset);
    $maxScan = min($offset + 8192, $audioEnd); // Only scan first 8 KB for sync
    $frameHeader = null;
    $frameOffset = $offset;

    while (ftell($fh) < $maxScan) {
        $byte = fread($fh, 1);
        if ($byte === false) break;
        if (ord($byte) !== 0xFF) continue;
        $next = fread($fh, 3);
        if (strlen($next) < 3) break;
        $h = (0xFF << 24) | (ord($next[0]) << 16) | (ord($next[1]) << 8) | ord($next[2]);
        $info = _mp3_parse_frame_header($h);
        if ($info) {
            $frameHeader = $info;
            $frameOffset = ftell($fh) - 4;
            break;
        }
        fseek($fh, -3, SEEK_CUR);
    }

    if (!$frameHeader) { fclose($fh); return 0.0; }

    // Check for Xing / VBRI VBR header (present in the first frame's data)
    $xingOffset = $frameOffset + 4;
    // Side-info padding: mono=17 bytes, stereo=32 bytes before Xing
    $sideInfoLen = ($frameHeader['channels'] === 1) ? 17 : 32;
    fseek($fh, $xingOffset + $sideInfoLen);
    $xingTag = fread($fh, 4);

    if ($xingTag === 'Xing' || $xingTag === 'Info') {
        $flags = unpack('N', fread($fh, 4))[1];
        $numFrames = null;
        if ($flags & 0x0001) {
            $numFrames = unpack('N', fread($fh, 4))[1];
        }
        if ($numFrames !== null && $frameHeader['samples_per_frame'] > 0 && $frameHeader['sample_rate'] > 0) {
            fclose($fh);
            return ($numFrames * $frameHeader['samples_per_frame']) / $frameHeader['sample_rate'];
        }
    }

    // Check VBRI (Fraunhofer VBR)
    fseek($fh, $xingOffset + 32); // VBRI is always at offset 32 from frame start
    $vbriTag = fread($fh, 4);
    if ($vbriTag === 'VBRI') {
        fread($fh, 6); // version + delay + quality
        fread($fh, 4); // bytes
        $numFrames = unpack('N', fread($fh, 4))[1];
        if ($numFrames > 0 && $frameHeader['samples_per_frame'] > 0 && $frameHeader['sample_rate'] > 0) {
            fclose($fh);
            return ($numFrames * $frameHeader['samples_per_frame']) / $frameHeader['sample_rate'];
        }
    }

    // CBR fallback: estimate from file size and bitrate
    fclose($fh);
    if ($frameHeader['bitrate'] > 0) {
        $audioBytes = $audioEnd - $frameOffset;
        return ($audioBytes * 8) / ($frameHeader['bitrate'] * 1000);
    }
    return 0.0;
}

function _mp3_parse_frame_header(int $h): ?array {
    // Sync word (bits 31–21 must all be 1) — 11 bits
    if (($h & 0xFFE00000) !== 0xFFE00000) return null;

    $versionBits  = ($h >> 19) & 0x03;
    $layerBits    = ($h >> 17) & 0x03;
    $bitrateBits  = ($h >> 12) & 0x0F;
    $sampleBits   = ($h >> 10) & 0x03;
    $channelMode  = ($h >>  6) & 0x03;

    if ($layerBits !== 1) return null;  // Only Layer III (MP3)
    if ($bitrateBits === 0x0F || $bitrateBits === 0x00) return null;
    if ($sampleBits === 0x03) return null;

    // Version
    static $versions = [null, 2.5, null, 2.0, 1.0]; // index = versionBits
    $versions = [2.5, null, 2.0, 1.0];
    $version = $versions[$versionBits] ?? null;
    if ($version === null) return null;

    // Bitrate table (kbps): [V1L3][index]
    static $bitrateTable = [
        1.0 => [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],
        2.0 => [0, 8,16,24,32,40,48,56, 64, 80, 96,112,128,144,160,0],
        2.5 => [0, 8,16,24,32,40,48,56, 64, 80, 96,112,128,144,160,0],
    ];
    $bitrate = $bitrateTable[$version][$bitrateBits] ?? 0;
    if ($bitrate === 0) return null;

    // Sample rate (Hz)
    static $sampleRateTable = [
        1.0 => [44100, 48000, 32000],
        2.0 => [22050, 24000, 16000],
        2.5 => [11025, 12000,  8000],
    ];
    $sampleRate = $sampleRateTable[$version][$sampleBits] ?? 0;
    if ($sampleRate === 0) return null;

    // Samples per frame (Layer III, MPEG1 = 1152, MPEG2/2.5 = 576)
    $samplesPerFrame = ($version === 1.0) ? 1152 : 576;

    return [
        'bitrate'          => $bitrate,
        'sample_rate'      => $sampleRate,
        'samples_per_frame'=> $samplesPerFrame,
        'channels'         => ($channelMode === 3) ? 1 : 2, // 3 = mono
    ];
}

// ──────────────────────────────────────────────
// WAV (RIFF PCM)
// ──────────────────────────────────────────────
function _wav_duration(string $file): float {
    $fh = @fopen($file, 'rb');
    if (!$fh) return 0.0;

    $riff = fread($fh, 12);
    if (strlen($riff) < 12 || substr($riff, 0, 4) !== 'RIFF' || substr($riff, 8, 4) !== 'WAVE') {
        fclose($fh);
        return 0.0;
    }

    $nSamplesPerSec = 0;
    $nBlockAlign    = 0;
    $dataSize       = 0;

    // Walk chunks
    while (!feof($fh)) {
        $chunk = fread($fh, 8);
        if (strlen($chunk) < 8) break;
        $id   = substr($chunk, 0, 4);
        $size = unpack('V', substr($chunk, 4, 4))[1];

        if ($id === 'fmt ') {
            $fmt = fread($fh, min($size, 40));
            $nSamplesPerSec = unpack('V', substr($fmt, 4, 4))[1];
            $nBlockAlign    = unpack('v', substr($fmt, 12, 2))[1];
        } elseif ($id === 'data') {
            $dataSize = $size;
            break;
        } else {
            fseek($fh, $size + ($size % 2), SEEK_CUR); // Pad to word boundary
        }
    }
    fclose($fh);

    if ($nSamplesPerSec > 0 && $nBlockAlign > 0 && $dataSize > 0) {
        return $dataSize / ($nSamplesPerSec * $nBlockAlign);
    }
    return 0.0;
}

// ──────────────────────────────────────────────
// OGG Vorbis
// ──────────────────────────────────────────────
function _ogg_duration(string $file): float {
    $fh = @fopen($file, 'rb');
    if (!$fh) return 0.0;

    // Read sample rate from first Ogg page (vorbis identification header)
    $sampleRate = 0;
    $page = fread($fh, 4096);
    // Vorbis ID header signature: "\x01vorbis"
    $pos = strpos($page, "\x01vorbis");
    if ($pos !== false && $pos + 27 <= strlen($page)) {
        // Sample rate is at offset +12 in the vorbis ID header (4 bytes LE)
        $srBytes = substr($page, $pos + 12, 4);
        if (strlen($srBytes) === 4) {
            $sampleRate = unpack('V', $srBytes)[1];
        }
    }

    if ($sampleRate <= 0) { fclose($fh); return 0.0; }

    // Read last Ogg page to get granule position (= total samples)
    $fileSize = filesize($file);
    $readFrom = max(0, $fileSize - 65536); // Read up to 64 KB from end
    fseek($fh, $readFrom);
    $tail = fread($fh, $fileSize - $readFrom);
    fclose($fh);

    // Walk Ogg pages in tail backwards — look for last valid page with granule
    $granule = 0;
    $offset  = 0;
    while (($p = strpos($tail, 'OggS', $offset)) !== false) {
        if ($p + 27 > strlen($tail)) break;
        // Granule position bytes 6–13 (8 bytes, signed LE 64-bit)
        // PHP unpack doesn't have 64-bit signed, handle manually
        $lo = unpack('V', substr($tail, $p + 6, 4))[1];
        $hi = unpack('V', substr($tail, $p + 10, 4))[1];
        $g  = ($hi != 0xFFFFFFFF || $lo != 0xFFFFFFFF)
            ? ($hi * 4294967296.0 + $lo)
            : -1;
        if ($g > 0) $granule = $g;
        $offset = $p + 4;
    }

    return ($granule > 0) ? ($granule / $sampleRate) : 0.0;
}
