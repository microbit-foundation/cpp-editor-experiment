import {
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
} from "@chakra-ui/form-control";
import { 
    Radio,
    RadioGroup,
} from "@chakra-ui/radio";
import { HStack } from "@chakra-ui/react";
import { ReactNode, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";

const FileTypeSelect = () => {
    return (
        <FormControl id="fileType">
        <FormLabel>
            <FormattedMessage id="file-type-text" />
        </FormLabel>
        
        <RadioGroup defaultValue='source'>
            <HStack spacing='24px'>
            <Radio value='source'><FormattedMessage id="file-type-radio-source"/></Radio>
            <Radio value='header'><FormattedMessage id="file-type-radio-header"/></Radio>
            </HStack>
        </RadioGroup>

        <FormHelperText color="gray.700">
        <FormattedMessage
          id="new-file-hint"
          values={{
            code: (chunks: ReactNode) => <code>{chunks}</code>,
          }}
        />
      </FormHelperText>

        </FormControl>
    );
}

export default FileTypeSelect;