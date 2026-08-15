import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getPhotoUrl } from "@/lib/civic";
import { cn } from "@/lib/utils";

export function ReportPhoto({
  path,
  alt,
  className,
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void getPhotoUrl(path).then((u) => {
      if (!active) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (failed)
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="size-5" />
      </div>
    );

  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;

  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
