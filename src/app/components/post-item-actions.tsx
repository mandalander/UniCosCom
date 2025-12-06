'use client';
import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguage } from './language-provider';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { EditPostForm } from './edit-post-form';
import { ReportDialog } from './report-dialog';

type Post = {
  id: string;
  title: string;
  content: string;
};

interface PostItemActionsProps {
  communityId: string;
  post: Post;
  isModerator?: boolean;
  isOwner?: boolean;
  postRef?: DocumentReference; // Optional direct reference
}

export function PostItemActions({ communityId, post, isModerator, isOwner, postRef }: PostItemActionsProps) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!firestore) return;

    // 1. Close the dialog FIRST to ensure pointer-events are restored.
    setIsDeleteDialogOpen(false);

    // 2. Small delay to allow Dialog cleanup (focus return, body scroll unlock)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use provided ref or construct it (fallback)
    const targetRef = postRef || doc(firestore, 'communities', communityId, 'posts', post.id);

    try {
      await deleteDocumentNonBlocking(targetRef);
      toast({ description: t('deletePostSuccess') });
    } catch (error: any) {
      console.error("Error deleting post:", error);
      console.log("Delete debug info:", { communityId, postId: post.id, path: postRef?.path });
      toast({
        variant: "destructive",
        description: `Failed to delete: ${error.message || 'Unknown error'} (Comm: ${communityId})`,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwner && (
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>{t('edit')}</span>
            </DropdownMenuItem>
          )}
          {(isOwner || isModerator) && (
            <>
              {isOwner && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{t('delete')}</span>
              </DropdownMenuItem>
            </>
          )}
          {!isOwner && (
            <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
              <Flag className="mr-2 h-4 w-4" />
              <span>{t('report')}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
      />

      <EditPostForm
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        communityId={communityId}
        post={post}
      />

      <ReportDialog
        isOpen={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        targetId={post.id}
        targetType="post"
        targetContent={post.content}
        communityId={communityId}
      />
    </>
  );
}
