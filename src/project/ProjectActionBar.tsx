/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, BoxProps, HStack, useMediaQuery, Progress, Stack, Spinner, Text } from "@chakra-ui/react";
import SendButton from "./SendButton";
import SaveMenuButton from "./SaveMenuButton";
import OpenButton from "./OpenButton";
import { widthXl } from "../common/media-queries";
import React, { ForwardedRef, useEffect, useState } from "react";
import { onLoaded, onProgress } from "../clang/clang";
interface ProjectActionBarProps extends BoxProps {
  sendButtonRef: React.RefObject<HTMLButtonElement>;
}

const ProjectActionBar = React.forwardRef(
  (
    { sendButtonRef, ...props }: ProjectActionBarProps,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const [isWideScreen] = useMediaQuery(widthXl);
    const size = "lg";

    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('Loading...');

    const [loaded, setLoaded] = useState(false);

    
    const progressCallback = (progress : number, msg? : string) => {
      setProgress(progress * 100);
      setProgressText(msg || 'Loading...');
    }

    // I think ideally we want a hook to get the clang worker
    // this will do for now
    useEffect(() => {
      setLoaded(false)

      onProgress(progressCallback)
      onLoaded(() => setLoaded(true));
      return () => {}
    }, [])
    
    const loadingBar = (
      <Stack
          flex='1'
          direction='column'
          justifyContent='center'
          gap={1}
      >
        <HStack
          justifyContent="space-between"
          px={2}
        >
          <HStack
            alignItems='center'
          >
            <Spinner
              size='sm'
            />
            <Text fontWeight='bold'>{progressText}</Text>
          </HStack>
          <Text fontWeight='bold'>{progress.toFixed(0)}%</Text>
        </HStack>

        <Progress 
          value={progress}
          size='md' 
          style={{
            marginTop: 0,
            borderRadius:99,
          }}
          sx={{ // animate transition when progress changes: https://github.com/chakra-ui/chakra-ui/issues/68#issuecomment-949696853
            "& > div:first-of-type": {
              transitionProperty: "width",
            },
          }}
        /> 
          
      </Stack>
    );

    return (
      <HStack
        {...props}
        justifyContent="space-between"
        py={5}
        px={isWideScreen ? 10 : 5}
        gap={10}
      >
        {loaded ? <SendButton size={size} ref={ref} sendButtonRef={sendButtonRef} /> : undefined}

        {loaded ? undefined : loadingBar}

        <HStack spacing={2.5}>
          {loaded ? <SaveMenuButton size={size} /> : undefined}
          
          <OpenButton mode="button" size={size} minW="fit-content" />
        </HStack>
      </HStack>
    );
  }
);

export default ProjectActionBar;
