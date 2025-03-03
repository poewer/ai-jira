import React, { useState } from "react";
import { Camera, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import ScreenshotPreview from "./ScreenshotPreview";

interface ReminderPopupProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: {
    workDescription: string;
    includeScreenshot: boolean;
    useAiEnhancement: boolean;
    screenshot?: string;
  }) => void;
  defaultWorkDescription?: string;
  defaultIncludeScreenshot?: boolean;
  defaultUseAiEnhancement?: boolean;
}

const ReminderPopup = ({
  isOpen = true,
  onClose = () => {},
  onSubmit = () => {},
  defaultWorkDescription = "",
  defaultIncludeScreenshot = false,
  defaultUseAiEnhancement = true,
}: ReminderPopupProps) => {
  const [workDescription, setWorkDescription] = useState(
    defaultWorkDescription,
  );
  const [includeScreenshot, setIncludeScreenshot] = useState(
    defaultIncludeScreenshot,
  );
  const [useAiEnhancement, setUseAiEnhancement] = useState(
    defaultUseAiEnhancement,
  );
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      workDescription,
      includeScreenshot,
      useAiEnhancement,
      screenshot: screenshot || undefined,
    });
    onClose();
  };

  const handleCaptureScreenshot = () => {
    // In a real implementation, this would capture the actual screen
    // For now, we'll use a placeholder image
    setScreenshot(
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
    );
    setIncludeScreenshot(true);
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setIncludeScreenshot(false);
  };

  const handleEnhanceWithAI = () => {
    if (!workDescription.trim()) return;

    setIsEnhancing(true);

    // Simulate AI enhancement with a timeout
    setTimeout(() => {
      const enhancedText = `${workDescription} [Enhanced with additional details: Completed the implementation of the user interface components as specified in the design documents. Ensured responsive behavior across different screen sizes and tested for accessibility compliance.]`;
      setWorkDescription(enhancedText);
      setIsEnhancing(false);
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>What have you been working on?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <Textarea
            placeholder="Describe your recent work activities..."
            className="min-h-[120px] resize-none"
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="screenshot"
                checked={includeScreenshot}
                onCheckedChange={setIncludeScreenshot}
              />
              <Label htmlFor="screenshot">Include screenshot</Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCaptureScreenshot}
              disabled={includeScreenshot && screenshot !== null}
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </Button>
          </div>

          {includeScreenshot && screenshot && (
            <div className="mt-2">
              <ScreenshotPreview
                imageUrl={screenshot}
                onRemove={handleRemoveScreenshot}
                onFullscreen={() => {}}
                onDownload={() => {}}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="ai-enhancement"
                checked={useAiEnhancement}
                onCheckedChange={setUseAiEnhancement}
              />
              <Label htmlFor="ai-enhancement">Use AI enhancement</Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEnhanceWithAI}
              disabled={
                !useAiEnhancement || !workDescription.trim() || isEnhancing
              }
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isEnhancing ? "Enhancing..." : "Enhance"}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!workDescription.trim()}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderPopup;
