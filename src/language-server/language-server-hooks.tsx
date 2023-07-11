/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useFileSystem } from "../fs/fs-hooks";
import { useSettings } from "../settings/settings";
import { LanguageServerClient } from "./client";
import {
  FsChangesListener,
  removeTrackFsChangesListener,
  trackFsChanges,
} from "./client-fs";
// import { pyright } from "./pyright";
import { clang } from "../clang/clang";

const LanguageServerClientContext = createContext<
  LanguageServerClient | undefined
>(undefined);

export const useLanguageServerClient = (): LanguageServerClient | undefined => {
  return useContext(LanguageServerClientContext);
};

interface LanguageServerClientProviderProps {
  children: ReactNode;
}

export const LanguageServerClientProvider = ({
  children,
}: LanguageServerClientProviderProps) => {
  const fs = useFileSystem();
  const [{ languageId }] = useSettings();
  const [clientState, setClientState] = useState<
    LanguageServerClient | undefined
  >(undefined);
  useEffect(() => {
    const client = clang(languageId).clangd.clangdClient();
    setClientState(client);
    let listener: FsChangesListener | undefined;
    client?.initialize().then(() => {
      listener = trackFsChanges(client, fs);

      client.didOpenTextDocument( {
        textDocument: {
          languageId: "c++",
          text: "int main() { return 0; }",
          uri: "file:///src/main.cpp",
        },
      });
    });
    return () => {
      if (listener) {
        removeTrackFsChangesListener(fs, listener);
      }
      client?.dispose();
    };
  }, [fs, languageId]);
  return (
    <LanguageServerClientContext.Provider value={clientState}>
      {children}
    </LanguageServerClientContext.Provider>
  );
};
