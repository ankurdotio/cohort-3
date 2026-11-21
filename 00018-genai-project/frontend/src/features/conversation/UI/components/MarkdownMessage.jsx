import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const remarkPlugins = [remarkGfm];

const components = {
  // Wide tables scroll inside the message instead of stretching the thread.
  table: ({ node: _node, ...props }) => (
    <div className="markdown-table">
      <table {...props} />
    </div>
  ),
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

/** Renders AI output as GitHub-flavored Markdown. Raw HTML is not rendered, so model output can't inject markup. */
export const MarkdownMessage = memo(function MarkdownMessage({ content }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>{content}</ReactMarkdown>
    </div>
  );
});
