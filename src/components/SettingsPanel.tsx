import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import {
  AlertCircle,
  Bell,
  Clock,
  Monitor,
  Power,
  Settings,
} from "lucide-react";
import { Separator } from "./ui/separator";
import ApiConfigSection from "./ApiConfigSection";

interface SettingsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (settings: SettingsData) => void;
  initialSettings?: SettingsData;
}

interface SettingsData {
  general: {
    autoStartup: boolean;
    reminderFrequency: number;
    minimizeToTray: boolean;
  };
  appearance: {
    darkMode: boolean;
    compactMode: boolean;
  };
  apis: {
    jira: { apiKey: string; domain: string; email: string; enabled: boolean };
    openai: { apiKey: string; enabled: boolean };
  };
}

const SettingsPanel = ({
  isOpen = true,
  onClose = () => {},
  onSave = () => {},
  initialSettings = {
    general: {
      autoStartup: true,
      reminderFrequency: 30,
      minimizeToTray: true,
    },
    appearance: {
      darkMode: false,
      compactMode: false,
    },
    apis: {
      jira: { apiKey: "", domain: "", email: "", enabled: false },
      openai: { apiKey: "", enabled: false },
    },
  },
}: SettingsPanelProps) => {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [activeTab, setActiveTab] = useState("general");

  const handleGeneralChange = (field: string, value: boolean | number) => {
    setSettings({
      ...settings,
      general: {
        ...settings.general,
        [field]: value,
      },
    });
  };

  const handleAppearanceChange = (field: string, value: boolean) => {
    setSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        [field]: value,
      },
    });
  };

  const handleApiConfigSave = (apiConfig: {
    jira: { apiKey: string; domain: string; email: string; enabled: boolean };
    openai: { apiKey: string; enabled: boolean };
  }) => {
    setSettings({
      ...settings,
      apis: apiConfig,
    });
  };

  const handleSaveSettings = () => {
    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <AlertCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <Tabs
            defaultValue="general"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b">
              <TabsList className="flex justify-start p-0 bg-transparent h-auto">
                <TabsTrigger
                  value="general"
                  className="px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Appearance
                </TabsTrigger>
                <TabsTrigger
                  value="integrations"
                  className="px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Integrations
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="general" className="p-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>
                    Configure how the application behaves on your system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Power className="h-4 w-4 text-gray-500" />
                      <Label htmlFor="auto-startup" className="font-medium">
                        Start on system boot
                      </Label>
                    </div>
                    <Switch
                      id="auto-startup"
                      checked={settings.general.autoStartup}
                      onCheckedChange={(checked) =>
                        handleGeneralChange("autoStartup", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      <Label htmlFor="minimize-tray" className="font-medium">
                        Minimize to system tray
                      </Label>
                    </div>
                    <Switch
                      id="minimize-tray"
                      checked={settings.general.minimizeToTray}
                      onCheckedChange={(checked) =>
                        handleGeneralChange("minimizeToTray", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <Label className="font-medium">Reminder Frequency</Label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Every {settings.general.reminderFrequency} minutes
                        </span>
                        <span className="text-sm font-medium">
                          {settings.general.reminderFrequency} min
                        </span>
                      </div>
                      <Slider
                        value={[settings.general.reminderFrequency]}
                        min={5}
                        max={120}
                        step={5}
                        onValueChange={(value) =>
                          handleGeneralChange("reminderFrequency", value[0])
                        }
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5 min</span>
                        <span>30 min</span>
                        <span>60 min</span>
                        <span>120 min</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="p-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance of the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="font-medium">
                      Dark Mode
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={settings.appearance.darkMode}
                      onCheckedChange={(checked) =>
                        handleAppearanceChange("darkMode", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-mode" className="font-medium">
                      Compact Mode
                    </Label>
                    <Switch
                      id="compact-mode"
                      checked={settings.appearance.compactMode}
                      onCheckedChange={(checked) =>
                        handleAppearanceChange("compactMode", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="p-4 space-y-6">
              <ApiConfigSection
                initialConfig={settings.apis}
                onSave={handleApiConfigSave}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
