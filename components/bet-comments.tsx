'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { CommentWithUser } from '@/lib/supabase/types'
import { addComment, deleteComment } from '@/lib/actions/comments'
import { Avatar } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/utils'

interface BetCommentsProps {
  betId: string
  comments: CommentWithUser[]
  currentUserId: string
}

export function BetComments({ betId, comments: initialComments, currentUserId }: BetCommentsProps) {
  const t = useTranslations('betComments')
  const locale = useLocale()
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const trimmed = body.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const newComment = await addComment(betId, trimmed) as unknown as CommentWithUser
      setComments((prev) => [...prev, newComment])
      setBody('')
    } catch {
      // silently fail — server validation will surface errors on refresh
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    try {
      await deleteComment(commentId, betId)
    } catch {
      // restore on error
      setComments(initialComments)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('title')}</h3>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <Avatar
                src={comment.commenter.avatar_url}
                name={comment.commenter.display_name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-card-foreground">
                    {comment.commenter.display_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.created_at, locale)}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-0.5 break-words">{comment.body}</p>
              </div>
              {comment.user_id === currentUserId && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs text-muted-foreground/50 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                  aria-label={t('deleteOwn')}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          maxLength={280}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || sending}
          className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors flex-shrink-0"
        >
          {t('send')}
        </button>
      </div>
    </div>
  )
}
