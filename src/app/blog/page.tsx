import Link from 'next/link';
import { PostService } from '@/services';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const postService = new PostService();
  const posts = await postService.findPublished();

  return (
    <div className="container max-w-4xl px-4 py-16">
      <div className="mb-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter">Blog</h1>
        <p className="text-lg text-muted-foreground">Latest articles and updates.</p>
      </div>

      <div className="space-y-8">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Check back soon!</p>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>{formatDate(post.createdAt)}</CardDescription>
                </CardHeader>
                {post.excerpt && (
                  <CardContent>
                    <p className="text-muted-foreground">{post.excerpt}</p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
