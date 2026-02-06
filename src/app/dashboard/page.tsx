import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { PostService } from '@/services';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = verifyToken(token);
  } catch {
    redirect('/login');
  }

  const postService = new PostService();
  const userPosts = await postService.findByAuthor(user.userId);

  return (
    <div className="container px-4 py-16">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userPosts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userPosts.filter((p) => p.published).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userPosts.filter((p) => !p.published).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Posts</h2>
        {userPosts.length === 0 ? (
          <p className="text-muted-foreground">You haven&apos;t created any posts yet.</p>
        ) : (
          userPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{post.title}</CardTitle>
                <Badge variant={post.published ? 'default' : 'secondary'}>
                  {post.published ? 'Published' : 'Draft'}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(post.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
