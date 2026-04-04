import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatMessage from '../ChatMessage'

describe('ChatMessage speaker button', () => {
  it('renders speaker button for assistant messages when onSpeak is provided', () => {
    render(
      <ChatMessage content="Hello there!" role="assistant" onSpeak={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: /read aloud/i })).toBeInTheDocument()
  })

  it('does not render speaker button for user messages', () => {
    render(
      <ChatMessage content="Hello there!" role="user" onSpeak={vi.fn()} />
    )
    expect(screen.queryByRole('button', { name: /read aloud/i })).not.toBeInTheDocument()
  })

  it('does not render speaker button when onSpeak is not provided', () => {
    render(
      <ChatMessage content="Hello there!" role="assistant" />
    )
    expect(screen.queryByRole('button', { name: /read aloud/i })).not.toBeInTheDocument()
  })

  it('calls onSpeak with content when speaker button clicked', async () => {
    const onSpeak = vi.fn()
    render(
      <ChatMessage content="Hello there!" role="assistant" onSpeak={onSpeak} />
    )
    await userEvent.click(screen.getByRole('button', { name: /read aloud/i }))
    expect(onSpeak).toHaveBeenCalledWith('Hello there!')
  })

  it('shows stop icon when isSpeakingThis is true', () => {
    render(
      <ChatMessage content="Hello" role="assistant" onSpeak={vi.fn()} isSpeakingThis={true} />
    )
    expect(screen.getByRole('button', { name: /stop reading/i })).toBeInTheDocument()
  })
})
