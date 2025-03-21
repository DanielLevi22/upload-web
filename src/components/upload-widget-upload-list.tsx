export function UploadWidgetUploadList() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Uploading</span>
        <span className="text-xs text-zinc-500">1/1</span>
      </div>
      <div className="bg-zinc-800 rounded-lg h-2">
        <div className="bg-zinc-500 h-2 rounded-lg" />
      </div>
    </div>
  )
}