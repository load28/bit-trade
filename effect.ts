import { Effect, Schema } from "effect";
import { ParseError } from "effect/ParseResult";

type Result<T, E = unknown> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

const toResult = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Effect.Effect<Result<A, E>, never, R> =>
  effect.pipe(
    Effect.match({
      onSuccess: (data) => ({ success: true as const, data }),
      onFailure: (error) => ({ success: false as const, error }),
    })
  );

const UserSchema = Schema.Struct({
  id: Schema.UUID,
  email: Schema.String,
  age: Schema.Number.pipe(
    Schema.int(),
    Schema.positive(),
    Schema.lessThanOrEqualTo(100)
  ),
  address: Schema.optional(Schema.String),
});

type User = typeof UserSchema.Type;

const tapUser = (
  effect: Effect.Effect<Result<User, ParseError>, never, never>
) =>
  effect.pipe(
    Effect.tap((result) => {
      if (result.success) {
        console.log("[User] Email:", result.data.email);
      } else {
        console.error("[User] Failed:", result.error);
      }
      return Effect.void;
    })
  );

const parseUser = Schema.decodeUnknown(UserSchema);

const userEffect = parseUser({
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "test@example.com",
  age: 30,
});

await Effect.runPromise(userEffect.pipe(toResult, tapUser));
