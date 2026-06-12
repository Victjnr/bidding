import { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadCloud, X, GripVertical, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaItem {
  id: string;
  file?: File;
  previewUrl: string;
  progress: number; // 0-100
  uploaded: boolean;
}

interface MediaUploadProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

export function MediaUpload({ items, onChange }: MediaUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newItems: MediaItem[] = Array.from(fileList)
        .filter((f) => f.size <= 5 * 1024 * 1024) // 5 MB limit
        .map((file) => ({
          id: `${Date.now()}-${file.name}`,
          file,
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          uploaded: false,
        }));

      onChange([...items, ...newItems]);
    },
    [items, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const removeItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Upload Media</h2>
        <p className="mt-2 text-sm text-muted">
          Add up to 20 images. The first image will be the cover. Drag to reorder.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors',
          isDragActive ? 'border-orange bg-orange/5' : 'border-border bg-white hover:border-orange/40',
        )}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky text-muted">
          <UploadCloud className="h-7 w-7" />
        </div>
        <p className="mt-3 text-sm font-medium text-ink">
          Drag & drop images here, or <span className="text-orange">browse</span>
        </p>
        <p className="mt-1 text-xs text-muted">JPG, PNG, WebP — Max 5 MB each</p>
      </div>

      {/* Sortable Preview Grid */}
      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item, index) => (
                <SortableMediaItem
                  key={item.id}
                  item={item}
                  isPrimary={index === 0}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

/* ── Sortable media item ── */
function SortableMediaItem({
  item,
  isPrimary,
  onRemove,
}: {
  item: MediaItem;
  isPrimary: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg border-2 bg-sky',
        isDragging ? 'z-10 border-orange shadow-lg opacity-80' : 'border-border',
        isPrimary && !isDragging && 'ring-2 ring-orange ring-offset-2',
      )}
    >
      <img src={item.previewUrl} alt="Preview" className="h-full w-full object-cover" />

      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 cursor-grab rounded bg-black/50 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-error group-hover:opacity-100"
        aria-label="Remove"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Primary Badge */}
      {isPrimary && (
        <span className="absolute bottom-2 left-2 rounded bg-orange px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          Cover
        </span>
      )}

      {/* Upload Progress */}
      {!item.uploaded && item.progress > 0 && item.progress < 100 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-border">
          <div className="h-full bg-orange transition-all" style={{ width: `${item.progress}%` }} />
        </div>
      )}
    </div>
  );
}
