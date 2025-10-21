import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const getCurrentUserByContext = (context: ExecutionContext): unknown => {
  const request = context.switchToHttp().getRequest<{ user?: unknown }>();
  return request.user;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): unknown =>
    getCurrentUserByContext(context),
);
