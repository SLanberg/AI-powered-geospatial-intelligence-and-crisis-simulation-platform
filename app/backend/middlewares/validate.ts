import { z } from "zod";
import { NextResponse } from "next/server";

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  response: NextResponse;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates request JSON body against a Zod schema
 */
export async function validateBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const rawBody: unknown = await request.json();
    const result = schema.safeParse(rawBody);

    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      return {
        success: false,
        response: NextResponse.json(
          {
            status: "error",
            error: "Validation failed",
            details: errorMessages,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        {
          status: "error",
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validates search params from request URL against a Zod schema
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  url: string,
  schema: T
): ValidationResult<z.infer<T>> {
  try {
    const parsedUrl = new URL(url);
    const paramsRecord: Record<string, string> = {};
    parsedUrl.searchParams.forEach((value, key) => {
      paramsRecord[key] = value;
    });

    const result = schema.safeParse(paramsRecord);

    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      return {
        success: false,
        response: NextResponse.json(
          {
            status: "error",
            error: "Invalid query parameters",
            details: errorMessages,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        {
          status: "error",
          error: "Failed to parse URL query parameters",
        },
        { status: 400 }
      ),
    };
  }
}
