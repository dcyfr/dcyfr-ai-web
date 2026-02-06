import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/services';
import { createPostSchema } from '@/lib/schemas';
import { verifyToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';

const postService = new PostService();

export async function GET() {
  try {
    const posts = await postService.findPublished();
    return NextResponse.json(posts);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const body = await request.json();
    const data = createPostSchema.parse(body);

    const post = await postService.create({
      ...data,
      authorId: payload.userId,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
