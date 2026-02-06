import { notFound } from 'next/navigation';
import { PostService } from '@/services';
import { Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const postService = new PostService();

  let post;
  try {
    post = await postService.findBySlug(slug);
  } catch {
    notFound();
  }

  if (!post.published) {
    notFound();
  }

  return (
    <article className="container max-w-3xl px-4 py-16">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{formatDate(post.createdAt)}</Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter">{post.title}</h1>
        {post.excerpt && (
          <p className="text-lg text-muted-foreground">{post.excerpt}</p>
        )}
      </div>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {post.content.split('\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
