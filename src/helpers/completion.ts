import { ErrorContext, handleError } from "../error";
import {
  CompletionCreateParams,
  CompletionMetadata,
  CompletionMode,
  CompletionModel,
  CursorPosition,
  EditorModel,
  FetchCompletionItemParams,
  Completion
} from "../types";
import { getTextAfterCursor, getTextBeforeCursor, HTTP} from "../utils";
import {generateSystemPrompt, generateUserPrompt} from '../helpers';
import {
  COMPLETION_API_ENDPOINT,
  DEFAULT_COMPLETION_CREATE_PARAMS,
  COMPLETION_MODEL_IDS,
} from "../constants";

/**
 * Fetches a completion item from the API.
 * @param {FetchCompletionItemParams} params - The parameters for fetching the completion item.
 * @returns {Promise<string | null>} The completion item or null if an error occurs or the request is aborted.
 */
export const fetchCompletionItem = async ({
  filename,
  language,
  technologies,
  externalContext,
  model,
  apiKey,
  reqModel,
  provider,
  position,
}: FetchCompletionItemParams): Promise<string | null> => {
  try {
    // const { completion } = await HTTP.POST<
    //   CompletionResponse,
    //   CompletionRequest
    // >(
    //   endpoint,
    //   {
    //     completionMetadata: constructCompletionMetadata({
    //       filename,
    //       position,
    //       model,
    //       language,
    //       technologies,
    //       externalContext,
    //     }),
    //   },
    //   {
    //     headers: { "Content-Type": CONTENT_TYPE_JSON },
    //     error: "Error while fetching completion item",
    //   }
    // );
    let completionMetadata = constructCompletionMetadata({
      filename,
      position,
      model,
      language,
      technologies,
      externalContext,
    });
    
    const url = COMPLETION_API_ENDPOINT[provider];
    const body = createRequestBody(completionMetadata,reqModel);
    const headers = createHeaders(apiKey);
    const completion = await HTTP.POST<Completion, CompletionCreateParams>(
      url,
      body,
      { headers }
    );
    return Promise.resolve(completion.choices[0].message.content)
    //return completion;
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "Cancelled" || err.name === "AbortError")
    )
      return null;

    handleError(err, ErrorContext.FETCH_COMPLETION_ITEM);

    return null;
  }
};

/**
 * Constructs the metadata needed for fetching a completion item.
 */
export const constructCompletionMetadata = ({
  filename,
  position,
  model,
  language,
  technologies,
  externalContext,
}: Omit<
  FetchCompletionItemParams,
  "text" | "endpoint" | "token" | "abortSignal" | "apiKey" | "reqModel" | "provider"
>): CompletionMetadata => {
  const completionMode = determineCompletionMode(position, model);

  const textBeforeCursor = getTextBeforeCursor(position, model);
  const textAfterCursor = getTextAfterCursor(position, model);

  return {
    filename,
    language,
    technologies,
    externalContext,
    textBeforeCursor,
    textAfterCursor,
    editorState: { completionMode },
  };
};

/**
 * Determines the completion mode based on the cursor position and editor model.
 * @param {CursorPosition} position - The cursor position in the editor.
 * @param {EditorModel} model - The editor model.
 * @returns {CompletionMode} The determined completion mode.
 */
const determineCompletionMode = (
  position: CursorPosition,
  model: EditorModel
): CompletionMode => {
  const textBeforeCursor = getTextBeforeCursor(position, model);
  const textAfterCursor = getTextAfterCursor(position, model);

  return textBeforeCursor && textAfterCursor
    ? "fill-in-the-middle"
    : "completion";
};

const createRequestBody = (
  completionMetadata: CompletionMetadata,
  reqModel:CompletionModel
): any=> {
  return {
    ...DEFAULT_COMPLETION_CREATE_PARAMS,
    model: getModelId(reqModel),
    messages: [
      { role: "system", content: generateSystemPrompt(completionMetadata) },
      { role: "user", content: generateUserPrompt(completionMetadata) },
    ],
  };
};


const createHeaders = (apiKey:string): Record<string, string>  => {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

const getModelId = (model:CompletionModel): string =>  {
  return COMPLETION_MODEL_IDS[model];
}
