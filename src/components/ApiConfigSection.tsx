import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../src/components/ui/tabs";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";
import { Button } from "../../src/components/ui/button";
import { Switch } from "../../src/components/ui/switch";
import { AlertCircle, CheckCircle2, Key } from "lucide-react";
import { Alert, AlertDescription } from "../../src/components/ui/alert";

interface ApiConfigSectionProps {
  onSave?: (config: {
    jira: { apiKey: string; domain: string; email: string; enabled: boolean };
    openai: { apiKey: string; enabled: boolean };
  }) => void;
  initialConfig?: {
    jira: { apiKey: string; domain: string; email: string; enabled: boolean };
    openai: { apiKey: string; enabled: boolean };
  };
}

const ApiConfigSection = ({
  onSave,
  initialConfig = {
    jira: { apiKey: "", domain: "", email: "", enabled: false },
    openai: { apiKey: "", enabled: false },
  },
}: ApiConfigSectionProps) => {
  const [config, setConfig] = useState(initialConfig);
  const [testStatus, setTestStatus] = useState<{
    jira: "idle" | "testing" | "success" | "error";
    openai: "idle" | "testing" | "success" | "error";
  }>({
    jira: "idle",
    openai: "idle",
  });

  const handleJiraChange = (field: string, value: string | boolean) => {
    setConfig({
      ...config,
      jira: {
        ...config.jira,
        [field]: value,
      },
    });
  };

  const handleOpenAIChange = (field: string, value: string | boolean) => {
    setConfig({
      ...config,
      openai: {
        ...config.openai,
        [field]: value,
      },
    });
  };

  const testJiraConnection = () => {
    setTestStatus({ ...testStatus, jira: "testing" });
    // Simulate API test
    setTimeout(() => {
      if (config.jira.apiKey && config.jira.domain) {
        setTestStatus({ ...testStatus, jira: "success" });
      } else {
        setTestStatus({ ...testStatus, jira: "error" });
      }
    }, 1000);
  };

  const testOpenAIConnection = () => {
    setTestStatus({ ...testStatus, openai: "testing" });
    // Simulate API test
    setTimeout(() => {
      if (config.openai.apiKey) {
        setTestStatus({ ...testStatus, openai: "success" });
      } else {
        setTestStatus({ ...testStatus, openai: "error" });
      }
    }, 1000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
        <CardDescription>
          Configure your API connections for Jira and OpenAI integration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="jira" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jira">Jira API</TabsTrigger>
            <TabsTrigger value="openai">OpenAI API</TabsTrigger>
          </TabsList>

          <TabsContent value="jira" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="jira-enabled" className="text-base font-medium">
                Enable Jira Integration
              </Label>
              <Switch
                id="jira-enabled"
                checked={config.jira.enabled}
                onCheckedChange={(checked) =>
                  handleJiraChange("enabled", checked)
                }
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jira-domain">Jira Domain</Label>
                <Input
                  id="jira-domain"
                  placeholder="https://your-domain.atlassian.net"
                  value={config.jira.domain}
                  onChange={(e) => handleJiraChange("domain", e.target.value)}
                  disabled={!config.jira.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-email">Email</Label>
                <Input
                  id="jira-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={config.jira.email}
                  onChange={(e) => handleJiraChange("email", e.target.value)}
                  disabled={!config.jira.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-api-key">API Key / Token</Label>
                <div className="relative">
                  <Input
                    id="jira-api-key"
                    type="password"
                    placeholder="Enter your Jira API token"
                    value={config.jira.apiKey}
                    onChange={(e) => handleJiraChange("apiKey", e.target.value)}
                    disabled={!config.jira.enabled}
                  />
                  <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>

              {testStatus.jira === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to connect to Jira. Please check your credentials.
                  </AlertDescription>
                </Alert>
              )}

              {testStatus.jira === "success" && (
                <Alert
                  variant="default"
                  className="bg-green-50 border-green-200 text-green-800"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Successfully connected to Jira!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={testJiraConnection}
                  disabled={
                    !config.jira.enabled || testStatus.jira === "testing"
                  }
                >
                  {testStatus.jira === "testing"
                    ? "Testing..."
                    : "Test Connection"}
                </Button>
                <Button onClick={handleSave}>Save Configuration</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="openai" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="openai-enabled" className="text-base font-medium">
                Enable OpenAI Integration
              </Label>
              <Switch
                id="openai-enabled"
                checked={config.openai.enabled}
                onCheckedChange={(checked) =>
                  handleOpenAIChange("enabled", checked)
                }
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="openai-api-key"
                    type="password"
                    placeholder="Enter your OpenAI API key"
                    value={config.openai.apiKey}
                    onChange={(e) =>
                      handleOpenAIChange("apiKey", e.target.value)
                    }
                    disabled={!config.openai.enabled}
                  />
                  <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>

              {testStatus.openai === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to connect to OpenAI. Please check your API key.
                  </AlertDescription>
                </Alert>
              )}

              {testStatus.openai === "success" && (
                <Alert
                  variant="default"
                  className="bg-green-50 border-green-200 text-green-800"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Successfully connected to OpenAI!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={testOpenAIConnection}
                  disabled={
                    !config.openai.enabled || testStatus.openai === "testing"
                  }
                >
                  {testStatus.openai === "testing"
                    ? "Testing..."
                    : "Test Connection"}
                </Button>
                <Button onClick={handleSave}>Save Configuration</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApiConfigSection;
