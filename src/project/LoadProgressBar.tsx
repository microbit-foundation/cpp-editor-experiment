import { HStack, Progress, Stack, Spinner, Text } from "@chakra-ui/react";
import { onLoaded, onProgress } from "../clang/clang";
import { useEffect, useState } from "react";
import useActionFeedback from "../common/use-action-feedback";

interface LoadProgressBarProps {
  setLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}

export const LoadProgressBar = ({ setLoaded }: LoadProgressBarProps) => {
  const actionFeedback = useActionFeedback();

  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("Loading...");

  const progressCallback = (progress: number, msg?: string) => {
    if (progress < 0 || progress > 1) return;

    const percent = progress * 100;
    setProgress(percent);
    setProgressText(msg || "Loading...");
  };

  // I think ideally we want a hook to get the clang worker
  // this will do for now
  useEffect(() => {
    setLoaded(false);

    onProgress(progressCallback);
    onLoaded(() => {
      setLoaded(true);
      actionFeedback.success({
        title: "Setup Complete!",
        description: "Ready to send hex to micro:bit",
      });
    });
    return () => {};
  }, [actionFeedback, setLoaded]);

  return (
    <Stack flex="1" direction="column" justifyContent="center" gap={1}>
      <HStack justifyContent="space-between" px={2}>
        <HStack alignItems="center">
          <Spinner size="sm" />
          <Text fontWeight="bold">{progressText}</Text>
        </HStack>
        <Text fontWeight="bold">{progress.toFixed(0)}%</Text>
      </HStack>

      <Progress
        value={progress}
        size="md"
        colorScheme="purple"
        style={{
          marginTop: 0,
          borderRadius: 99,
        }}
        sx={{
          // animate transition when progress changes: https://github.com/chakra-ui/chakra-ui/issues/68#issuecomment-949696853
          "& > div:first-of-type": {
            transitionProperty: "width",
          },
        }}
      />
    </Stack>
  );
};
