/**
 * Markdown renderer adapted from the forked chatbox codebase
 * (src/renderer/components/Markdown.tsx).
 *
 * Simplified for the web platform: removed Mantine, i18n, NiceModal,
 * EdgeOne deploy, and artifact preview. Kept the core rendering pipeline:
 * react-markdown + remark-gfm + remark-math + rehype-katex + Prism syntax
 * highlighting + copy button on code blocks.
 *
 * LaTeX preprocessing uses processLaTeX() from the original Chatbox source
 * (src/renderer/packages/latex.ts) to correctly handle currency symbols
 * ($100) vs math expressions and escape mhchem notation.
 */
import { sanitizeUrl } from '@braintree/sanitize-url'
import { memo, useCallback, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeKatex from 'rehype-katex'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import { processLaTeX } from '@/lib/chatbox-utils'

function Markdown({ children, className }: { children: string; className?: string }) {
  // Preprocess LaTeX using the Chatbox source utility to correctly handle
  // currency ($100) vs math expressions and escape mhchem notation
  const processed = useMemo(() => processLaTeX(children), [children])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
      rehypePlugins={[rehypeKatex]}
      className={cn('break-words', className)}
      urlTransform={(url) => sanitizeUrl(url)}
      components={useMemo(
        () => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: (props: any) => <CodeRenderer {...props} />,
          a: ({ ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer"
              className="text-chatbox-tint-brand underline hover:opacity-80"
            />
          ),
          table: ({ ...props }) => (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-full border-collapse border border-chatbox-border-primary text-sm" {...props} />
            </div>
          ),
          th: ({ ...props }) => (
            <th className="border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-1.5 text-left font-semibold" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border border-chatbox-border-primary px-3 py-1.5" {...props} />
          ),
        }),
        []
      )}
    >
      {processed}
    </ReactMarkdown>
  )
}

export default memo(Markdown)

const CodeRenderer = memo(function CodeRenderer(props: {
  children: string
  className?: string
}) {
  const { children, className } = props
  const language = /language-(\w+)/.exec(className || '')?.[1] || 'text'

  // Inline code
  if (!String(children).includes('\n')) {
    return (
      <code className="rounded-sm border border-chatbox-border-secondary bg-chatbox-background-secondary px-1 py-0.5 mx-0.5 text-sm">
        {children}
      </code>
    )
  }

  // Block code with syntax highlighting and copy button
  return <BlockCode language={language}>{children}</BlockCode>
})

const BlockCode = memo(function BlockCode({
  language,
  children,
}: {
  language: string
  children: string
}) {
  const [copied, setCopied] = useState(false)
  const langLabel = useMemo(() => language.toUpperCase(), [language])

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(String(children)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [children])

  return (
    <div className="my-2 overflow-hidden rounded-md border border-chatbox-border-primary">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-chatbox-background-secondary px-xs py-1">
        <span className="font-mono text-xs text-chatbox-tint-tertiary">{langLabel}</span>
        <button
          onClick={onCopy}
          className="rounded px-1.5 py-0.5 text-xs text-chatbox-tint-tertiary hover:bg-chatbox-background-secondary-hover"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Code block */}
      <SyntaxHighlighter
        style={oneLight}
        language={language}
        PreTag="div"
        showLineNumbers
        customStyle={{
          margin: 0,
          borderRadius: 0,
          border: 'none',
          background: 'transparent',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
})
