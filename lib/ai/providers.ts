import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": gateway.languageModel("openai/gpt-5"),
        "title-model": gateway.languageModel("openai/gpt-5"),
        "artifact-model": gateway.languageModel("openai/gpt-5"),
      },
    });
