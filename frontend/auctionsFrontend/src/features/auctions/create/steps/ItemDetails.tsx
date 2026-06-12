import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetCategoriesQuery } from '@/store/api/auctionApi';

interface ItemDetailsProps {
  title: string;
  description: string;
  category: string;
  condition: string;
  location: string;
  onChange: (fields: Partial<{
    title: string;
    description: string;
    category: string;
    condition: string;
    location: string;
  }>) => void;
}

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used_like_new', label: 'Used — Like New' },
  { value: 'used_good', label: 'Used — Good' },
  { value: 'used_fair', label: 'Used — Fair' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'parts_only', label: 'For Parts Only' },
];

export function ItemDetails({ title, description, category, condition, location, onChange }: ItemDetailsProps) {
  const { data: categoryData, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const dynamicCategories = categoryData?.data || [];

  const editor = useEditor({
    extensions: [StarterKit],
    content: description,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm prose-slate max-w-none min-h-[200px] p-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange({ description: e.getHTML() });
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Item Details</h2>
        <p className="mt-2 text-sm text-muted">
          Describe your item clearly. Great descriptions lead to better bids.
        </p>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="auction-title" className="text-sm font-medium text-ink">
          Title <span className="text-error">*</span>
        </label>
        <input
          id="auction-title"
          type="text"
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Vintage Rolex Submariner 1968"
          className="input"
          maxLength={120}
        />
        <p className="text-xs text-muted text-right">{title.length}/120</p>
      </div>

      {/* Description (TipTap) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink">
          Description <span className="text-error">*</span>
        </label>
        <div className="overflow-hidden rounded-lg border border-border bg-white focus-within:border-orange focus-within:ring-1 focus-within:ring-orange/30">
          {/* Toolbar */}
          {editor && (
            <div className="flex items-center gap-1 border-b border-border px-3 py-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <div className="mx-1 h-5 w-px bg-border" />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive('heading', { level: 2 })}
                title="Heading"
              >
                <Heading2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive('orderedList')}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
            </div>
          )}
          <EditorContent editor={editor} />
      {/* Category */}
      <div className="space-y-1.5">
        <label htmlFor="auction-category" className="text-sm font-medium text-ink">
          Category <span className="text-error">*</span>
        </label>
        <select
          id="auction-category"
          value={category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="input"
        >
          <option value="">Select a category</option>
          {dynamicCategories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Condition */}
        <div className="space-y-1.5">
          <label htmlFor="auction-condition" className="text-sm font-medium text-ink">
            Condition <span className="text-error">*</span>
          </label>
          <select
            id="auction-condition"
            value={condition}
            onChange={(e) => onChange({ condition: e.target.value })}
            className="input"
          >
            <option value="">Select condition</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label htmlFor="auction-location" className="text-sm font-medium text-ink">
            Item Location
          </label>
          <input
            id="auction-location"
            type="text"
            value={location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="e.g. Harare, Zimbabwe"
            className="input"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Toolbar button helper ── */
function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'rounded p-1.5 transition-colors focus:outline-none',
        active ? 'bg-sky text-orange' : 'text-muted hover:bg-sky hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
