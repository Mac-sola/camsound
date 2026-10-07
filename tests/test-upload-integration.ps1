# Test CamSound Upload Endpoint Integration
# This script tests the end-to-end upload flow with authentication

$baseUrl = "http://localhost:5000/api"

Write-Host "🎵 CamSound Upload Integration Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Artist
Write-Host "Step 1: Login as Artist..." -ForegroundColor Yellow
$loginBody = @{
    email = "artist@camsound.com"
    password = "Artist@123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success) {
        Write-Host "✅ Login successful" -ForegroundColor Green
        $token = $loginData.data.token
        $artistId = $loginData.data.id
        Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
        Write-Host "   Artist ID: $artistId" -ForegroundColor Gray
    } else {
        Write-Host "❌ Login failed: $($loginData.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login request failed: $($_)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create a test audio file
Write-Host "Step 2: Creating test audio file..." -ForegroundColor Yellow
$testAudioPath = "C:\temp\test-song.mp3"
$testCoverPath = "C:\temp\test-cover.jpg"

# Create temp directory if needed
if (-not (Test-Path "C:\temp")) {
    New-Item -ItemType Directory -Path "C:\temp" -Force | Out-Null
}

# Create a minimal MP3 file (just binary data - not real audio)
$mp3Header = @(0xFF, 0xFB, 0x90, 0x00) + @(0x00) * 96
[System.IO.File]::WriteAllBytes($testAudioPath, [byte[]]$mp3Header)
Write-Host "✅ Test audio created: $testAudioPath" -ForegroundColor Green

# Create a minimal JPG file (just binary data - not real image)
$jpgHeader = @(0xFF, 0xD8, 0xFF, 0xE0) + @(0x00) * 96
[System.IO.File]::WriteAllBytes($testCoverPath, [byte[]]$jpgHeader)
Write-Host "✅ Test cover created: $testCoverPath" -ForegroundColor Green

Write-Host ""

# Step 3: Test upload endpoint
Write-Host "Step 3: Testing upload endpoint..." -ForegroundColor Yellow

$boundary = [System.Guid]::NewGuid().ToString()
$body = New-Object System.IO.MemoryStream

# Add form fields
$formFields = @{
    upload_type = "song"
    title = "Test Track $(Get-Random -Minimum 1000 -Maximum 9999)"
    genre = "Afrobeat"
}

# Helper to add form field
function Add-FormField {
    param([string]$name, [string]$value, [System.IO.MemoryStream]$stream, [string]$boundary)
    $fieldData = "`r`n--$boundary`r`nContent-Disposition: form-data; name=`"$name`"`r`n`r`n$value"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($fieldData)
    $stream.Write($bytes, 0, $bytes.Length)
}

# Helper to add file
function Add-FormFile {
    param([string]$name, [string]$filePath, [System.IO.MemoryStream]$stream, [string]$boundary)
    $fileName = Split-Path -Leaf $filePath
    $fileData = "`r`n--$boundary`r`nContent-Disposition: form-data; name=`"$name`"; filename=`"$fileName`"`r`nContent-Type: application/octet-stream`r`n`r`n"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($fileData)
    $stream.Write($bytes, 0, $bytes.Length)
    
    # Add file content
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $stream.Write($fileBytes, 0, $fileBytes.Length)
}

# Add form fields
foreach ($field in $formFields.GetEnumerator()) {
    Add-FormField -name $field.Key -value $field.Value -stream $body -boundary $boundary
}

# Add files
Add-FormFile -name "song_file" -filePath $testAudioPath -stream $body -boundary $boundary
Add-FormFile -name "cover_art" -filePath $testCoverPath -stream $body -boundary $boundary

# Add closing boundary
$closeData = "`r`n--$boundary--`r`n"
$closeBytes = [System.Text.Encoding]::UTF8.GetBytes($closeData)
$body.Write($closeBytes, 0, $closeBytes.Length)

$body.Seek(0, [System.IO.SeekOrigin]::Begin) | Out-Null
$bodyBytes = $body.ToArray()

try {
    $uploadResponse = Invoke-WebRequest -Uri "$baseUrl/upload/song" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body $bodyBytes `
        -UseBasicParsing
    
    $uploadData = $uploadResponse.Content | ConvertFrom-Json
    
    if ($uploadData.success) {
        Write-Host "✅ Upload successful" -ForegroundColor Green
        Write-Host "   Song ID: $($uploadData.data.id)" -ForegroundColor Gray
        Write-Host "   Title: $($uploadData.data.title)" -ForegroundColor Gray
        Write-Host "   Status: $($uploadData.data.status)" -ForegroundColor Gray
        Write-Host "   Moderation Status: $($uploadData.data.moderationStatus)" -ForegroundColor Gray
        Write-Host "   File Path: $($uploadData.data.filePath)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Upload failed: $($uploadData.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Upload request failed: $($_)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
