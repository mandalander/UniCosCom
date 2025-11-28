'use client';
import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { EditCommentForm } from './edit-comment-form';

type Comment = {
  id: string;
  content: string;
};

interface CommentItemActionsProps {
  communityId: string;
  postId: string;
  comment: Comment;
}

export function CommentItemActions({ communityId, postId, comment }: CommentItemActionsProps) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!firestore) return;
    const commentRef = doc(firestore, 'communities', communityId, 'posts', postId, 'comments', comment.id);
    try {
      await deleteDocumentNonBlocking(commentRef);
      toast({ description: t('deleteCommentSuccess') });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        variant: "destructive",
        description: t('deleteCommentError') || "Failed to delete comment.",
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
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>{t('edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{t('delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
      />

      <EditCommentForm
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        communityId={communityId}
        postId={postId}
        comment={comment}
      />
    </>
  );
}
