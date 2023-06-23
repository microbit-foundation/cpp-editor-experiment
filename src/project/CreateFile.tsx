/**
* (c) 2021, Micro:bit Educational Foundation and contributors
*
* SPDX-License-Identifier: MIT
*/


import { ReactNode, useEffect, useRef, useState } from "react";
import { InputDialogBody } from "../common/InputDialog";
import { Stack, HStack } from "@chakra-ui/react";

import {
    FormControl,
    FormHelperText,
    FormLabel,
} from "@chakra-ui/form-control";
import { 
    Radio,
    RadioGroup,
} from "@chakra-ui/radio";

import { FormattedMessage } from "react-intl";

import NewFileNameQuestion from "./NewFileNameQuestion";
  
interface CreateFileProps extends InputDialogBody<string> {}
  
const CreateFileQuestion = ({
    validationResult,
    value,
    setValidationResult,
    setValue,
    validate,
}: CreateFileProps) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) {
        ref.current.focus();
        }
    }, []);

    const [filename, setFilename] = useState("");
    const [filetype, setFiletype] = useState("source");

    const fileExts = new Map()
    fileExts.set('source', '.cpp');
    fileExts.set('header', '.h');

    useEffect(() => {
        const combinedValue = filename + fileExts.get(filetype);
        setValue(combinedValue);
      }, [filename, filetype, setValue]);

    return (
        <Stack spacing="24px">
            <NewFileNameQuestion
                value={filename}
                setValue={setFilename}
                validationResult={validationResult}
                setValidationResult={setValidationResult}
                validate={validate}
            />
            <FormControl id="fileType">
                <FormLabel>
                    <FormattedMessage id="file-type-text" />
                </FormLabel>
                
                <RadioGroup value={filetype} onChange={setFiletype}>
                    <HStack spacing='24px'>
                    <Radio value='source'><FormattedMessage id="file-type-radio-source"/></Radio>
                    <Radio value='header'><FormattedMessage id="file-type-radio-header"/></Radio>
                    </HStack>
                </RadioGroup>

                {/* <FormHelperText color="gray.700">
                    <FormattedMessage
                    id="new-file-hint"
                    values={{
                        code: (chunks: ReactNode) => <code>{chunks}</code>,
                    }}
                    />
                </FormHelperText> */}
            </FormControl>
        </Stack>

        
    );
}

export default CreateFileQuestion;
  