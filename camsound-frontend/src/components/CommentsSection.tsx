import { useState, useEffect, useCallback, useRef } from "react";
import { commentsService } from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ─── Types ───────────────────────────────────────────────────── */
interface CommentUser {
  _id: string;
  name: string;
  avatar?: string;
  type?: string;
}

interface Reply {
  _id: string;
  userId: CommentUser;
  content: string;
  createdAt: string;
  likes: string[];
  isPinned?: boolean;
}

interface Comment {
  _id: string;
  userId: CommentUser;
  content: string;
  createdAt: string;
  isPinned: boolean;
  likes: string[];
  replies: Reply[];
}

interface CommentsSectionProps {
  songId: string;
  artistUserId?: string; // userId of the song's artist — used for verified badge
  canModerate?: boolean; // artist / admin can pin & delete any comment
}

/* ─── Helpers ─────────────────────────────────────────────────── */
const QUICK_EMOJIS = ["👍", "❤️", "🔥", "🎵", "😍", "🙌", "💯", "😂"];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function avatarColor(name: string): string {
  const colors = ["#FACC15", "#f97316", "#10b981", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ user, size = 36 }: { user: CommentUser; size?: number }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: avatarColor(user.name), color: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: size * 0.4,
      }}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Single comment + its replies ───────────────────────────── */
interface CommentItemProps {
  comment: Comment | Reply;
  songId: string;
  currentUserId?: string;
  artistUserId?: string;
  canModerate: boolean;
  isReply?: boolean;
  onReplyPosted: () => void;
  onDeleted: () => void;
  onPinToggle?: () => void;
}

function CommentItem({
  comment, songId, currentUserId, artistUserId,
  canModerate, isReply = false, onReplyPosted, onDeleted, onPinToggle,
}: CommentItemProps) {
  const [likesCount, setLikesCount] = useState((comment.likes ?? []).length);
  const [liked, setLiked] = useState((comment.likes ?? []).includes(currentUserId ?? ""));
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = comment.userId?._id === currentUserId;
  const isArtist = comment.userId?._id === artistUserId;
  const isPinned = (comment as Comment).isPinned;

  const handleLike = async () => {
    try {
      setLiked((p) => !p);
      setLikesCount((p) => liked ? p - 1 : p + 1);
      await commentsService.likeComment(songId, comment._id);
    } catch {
      // revert on failure
      setLiked((p) => !p);
      setLikesCount((p) => liked ? p + 1 : p - 1);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      await commentsService.postComment(songId, replyText.trim(), comment._id);
      setReplyText("");
      setShowReplyBox(false);
      onReplyPosted();
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;
    await commentsService.deleteComment(songId, comment._id);
    onDeleted();
  };

  const insertEmoji = (emoji: string) => {
    setReplyText((p) => p + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div
      style={{
        display: "flex", gap: 10,
        paddingLeft: isReply ? 44 : 0,
        marginBottom: isReply ? 8 : 0,
      }}
    >
      <Avatar user={comment.userId} size={isReply ? 30 : 36} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Pin banner */}
        {isPinned && !isReply && (
          <div className="cs-pin-banner">
            <i className="fas fa-thumbtack" /> Pinned by artist
          </div>
        )}

        <div
          className={`cs-bubble${isArtist ? " cs-bubble--artist" : ""}${isPinned && !isReply ? " cs-bubble--pinned" : ""}`}
        >
          {/* Header row */}
          <div className="cs-bubble-header">
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="cs-username">{comment.userId?.name ?? "Unknown"}</span>
              {isArtist && (
                <span className="cs-artist-badge">
                  <i className="fas fa-check" /> Artist
                </span>
              )}
            </div>
            <span className="cs-timestamp">{relativeTime(comment.createdAt)}</span>
          </div>

          {/* Comment text */}
          <p className="cs-text">{comment.content}</p>

          {/* Action row */}
          <div className="cs-actions-row">
            <button
              className={`cs-like-btn${liked ? " cs-like-btn--liked" : ""}`}
              onClick={handleLike}
            >
              <i className={liked ? "fas fa-heart" : "far fa-heart"} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>

            {!isReply && (
              <button
                className="cs-action-btn"
                onClick={() => { setShowReplyBox((p) => !p); setTimeout(() => textareaRef.current?.focus(), 50); }}
              >
                <i className="far fa-comment" /> Reply
              </button>
            )}

            {canModerate && !isReply && onPinToggle && (
              <button className="cs-action-btn" onClick={onPinToggle}>
                <i className={`fas fa-thumbtack${isPinned ? "" : "-slash"}`} />
                {isPinned ? " Unpin" : " Pin"}
              </button>
            )}

            {(isOwner || canModerate) && (
              <button className="cs-action-btn cs-action-btn--danger" onClick={handleDelete}>
                <i className="fas fa-trash" />
              </button>
            )}
          </div>
        </div>

        {/* Inline reply composer */}
        {showReplyBox && (
          <div className="cs-reply-box">
            <div className="cs-emoji-bar">
              {QUICK_EMOJIS.map((e) => (
                <button key={e} className="cs-emoji-btn" onClick={() => insertEmoji(e)}>{e}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <textarea
                ref={textareaRef}
                className="cs-reply-textarea"
                rows={2}
                placeholder={`Reply to ${comment.userId?.name ?? "this comment"}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply(); }}
              />
              <button
                className="cs-post-btn"
                onClick={handleReply}
                disabled={posting || !replyText.trim()}
              >
                {posting ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />}
              </button>
            </div>
            <div className="cs-reply-hint">Ctrl+Enter to send</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main CommentsSection ─────────────────────────────────────── */
export default function CommentsSection({ songId, artistUserId, canModerate = false }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await commentsService.getSongComments(songId);
      if (res.data.success) {
        const data: Comment[] = res.data.data;
        // Pinned first, then newest
        data.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setComments(data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [songId]);

  useEffect(() => { load(); }, [load]);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await commentsService.postComment(songId, text.trim());
      setText("");
      await load();
    } finally { setPosting(false); }
  };

  const insertEmoji = (emoji: string) => {
    setText((p) => p + emoji);
    textareaRef.current?.focus();
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

  return (
    <div className="cs-root">
      {/* Header */}
      <div className="cs-header">
        <i className="far fa-comments" />
        <span>Comments</span>
        {totalCount > 0 && <span className="cs-count">{totalCount}</span>}
      </div>

      {/* Composer */}
      <div className="cs-composer">
        {user && <Avatar user={{ _id: user._id ?? "", name: user.name ?? "You", avatar: user.avatar, type: user.type }} size={36} />}
        <div style={{ flex: 1 }}>
          <div className="cs-emoji-bar">
            <button className="cs-emoji-toggle" onClick={() => setShowEmoji((p) => !p)}>
              <i className="far fa-smile" />
            </button>
            {showEmoji && QUICK_EMOJIS.map((e) => (
              <button key={e} className="cs-emoji-btn" onClick={() => { insertEmoji(e); setShowEmoji(false); }}>{e}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <textarea
              ref={textareaRef}
              className="cs-composer-textarea"
              rows={2}
              placeholder="Share your thoughts on this track…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost(); }}
            />
            <button
              className="cs-post-btn"
              onClick={handlePost}
              disabled={posting || !text.trim()}
            >
              {posting ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-paper-plane" /> Post</>}
            </button>
          </div>
          <div className="cs-reply-hint">Ctrl+Enter to post</div>
        </div>
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="cs-loading"><i className="fas fa-spinner fa-spin" /> Loading comments…</div>
      ) : comments.length === 0 ? (
        <div className="cs-empty">
          <i className="far fa-comments" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="cs-list">
          {comments.map((comment) => (
            <div key={comment._id} className="cs-comment-block">
              <CommentItem
                comment={comment}
                songId={songId}
                currentUserId={user?._id}
                artistUserId={artistUserId}
                canModerate={canModerate}
                onReplyPosted={load}
                onDeleted={load}
                onPinToggle={() => commentsService.pinComment(songId, comment._id, !comment.isPinned).then(load)}
              />

              {/* Replies */}
              {(comment.replies ?? []).length > 0 && (
                <div className="cs-replies">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply._id}
                      comment={reply as unknown as Comment}
                      songId={songId}
                      currentUserId={user?._id}
                      artistUserId={artistUserId}
                      canModerate={canModerate}
                      isReply
                      onReplyPosted={load}
                      onDeleted={load}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}