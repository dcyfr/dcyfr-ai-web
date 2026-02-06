import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/schemas';
import { UserService } from '@/services';
import { generateToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const userService = new UserService();
    const user = await userService.create(data);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
