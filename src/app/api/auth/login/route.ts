import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas';
import { UserService } from '@/services';
import { verifyPassword, generateToken } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const userService = new UserService();
    const user = await userService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const validPassword = verifyPassword(data.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
