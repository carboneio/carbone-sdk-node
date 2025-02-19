declare module 'carbone-sdk' {
  import { type Readable } from 'stream';

  // Core interfaces for the SDK
  export interface CarboneSDKOptions {
    carboneUrl?: string;
    isReturningBuffer?: boolean;
    retriesOnError?: number;
    retriesIntervalOnError?: number;
  }

  export interface CarboneRenderOptions {
    isReturningBuffer?: boolean;
    headers?: {
      'carbone-webhook-url'?: string;
      'carbone-template-delete-after'?: number;
      'content-disposition'?: string;
      [key: string]: unknown;
    };
  }

  export interface CarboneRenderData extends Record<string, unknown> {
    data: Record<string, unknown> | Record<string, unknown>[];
    convertTo?: string | Record<string, unknown>;
    reportName?: string;
  }

  // Individual module interfaces matching the internal structure
  interface RenderModule {
    getFilename(streamedResponse: {
      headers?: Record<string, string>;
    }): string | null;
    render(
      template: string | Buffer,
      data: CarboneRenderData,
      options:
        | CarboneRenderOptions
        | ((error: Error | null, buffer?: Buffer, filename?: string) => void),
      callback?: (
        error: Error | null,
        buffer?: Buffer,
        filename?: string,
      ) => void,
    ): Readable;
  }

  interface TemplatesModule {
    addTemplate(
      template: string | Buffer,
      payload: string | ((error: Error | null, templateId?: string) => void),
      callback?: (error: Error | null, templateId?: string) => void,
      _retry?: boolean,
    ): Readable;

    delTemplate(
      templateId: string,
      callback: (error: Error | null) => void,
      _retry?: boolean,
    ): void;

    getTemplate(
      templateId: string,
      callback?: (error: Error | null, content?: Buffer) => void,
    ): Readable;
  }

  interface PromiseModule {
    addTemplatePromise(
      template: string | Buffer,
      payload?: string,
    ): Promise<string>;
    delTemplatePromise(templateId: string): Promise<void>;
    getTemplatePromise(templateId: string): Promise<Buffer>;
    renderPromise(
      template: string | Buffer,
      data: CarboneRenderData,
      options?: CarboneRenderOptions,
    ): Promise<{ content: Buffer; filename: string }>;
  }

  // Main SDK interface combining all modules
  interface CarboneSDK extends RenderModule, TemplatesModule, PromiseModule {
    setApiVersion(version: number): void;
    setOptions(options: CarboneSDKOptions): void;
    clearTemplateCache(path: string): void;
  }

  // Factory function type
  type CarboneSDKFactory = (apiKey: string) => CarboneSDK;

  // Main module export
  const carboneSDK: CarboneSDKFactory;
  export default carboneSDK;
}
