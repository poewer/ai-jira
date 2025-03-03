import React, { useState } from "react";
import { X, Maximize, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ScreenshotPreviewProps {
  imageUrl?: string;
  onRemove?: () => void;
  onFullscreen?: () => void;
  onDownload?: () => void;
}

const ScreenshotPreview = ({
  imageUrl = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
  onRemove = () => {},
  onFullscreen = () => {},
  onDownload = () => {},
}: ScreenshotPreviewProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Card
      className="w-full h-[120px] bg-white relative overflow-hidden border border-gray-200 rounded-md"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt="Screenshot preview"
          className="w-full h-full object-cover"
        />
      </div>

      {isHovering && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onRemove}
                    className="rounded-full bg-white/90 hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove screenshot</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onFullscreen}
                    className="rounded-full bg-white/90 hover:bg-white"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View fullscreen</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onDownload}
                    className="rounded-full bg-white/90 hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download screenshot</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        Screenshot
      </div>
    </Card>
  );
};

export default ScreenshotPreview;
