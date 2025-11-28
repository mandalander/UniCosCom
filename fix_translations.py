import re

# Read the file
with open('src/lib/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Missing keys to add
missing_keys = {
    'pl': {
        # After editProfileGitHub
        'profileSocialLinks': 'Linki społecznościowe',
        # After creatingPost
        'postCreationError': 'Błąd tworzenia posta',
        # After commenting
        'commentCreationError': 'Błąd dodawania komentarza',
        # After deletePostSuccess
        'deletePostError': 'Błąd usuwania posta',
        # After deleteCommentSuccess  
        'deleteCommentError': 'Błąd usuwania komentarza',
        # After userUpvotedYourComment
        'notificationsTitle': 'Powiadomienia',
        'notificationsDescription': 'Tutaj zobaczysz powiadomienia o aktywności w Twoich postach i komentarzach.',
        'notificationVoted': 'Głosowanie',
        'notificationCommented': 'Komentarz',
        'post': 'post',
        'comment': 'komentarz',
        'viewContext': 'Zobacz kontekst',
    },
    'en': {
        'profileSocialLinks': 'Social Links',
        'postCreationError': 'Error creating post',
        'commentCreationError': 'Error adding comment',
        'deletePostError': 'Error deleting post',
        'deleteCommentError': 'Error deleting comment',
        'notificationsTitle': 'Notifications',
        'notificationsDescription': 'Here you will see notifications about activity on your posts and comments.',
        'notificationVoted': 'Vote',
        'notificationCommented': 'Comment',
        'post': 'post',
        'comment': 'comment',
        'viewContext': 'View context',
    }
}

# For Polish section
content = content.replace(
    "    editProfileSocialLinksPlaceholder: 'Link do Twojego profilu',",
    "    editProfileSocialLinksPlaceholder: 'Link do Twojego profilu',\n    profileSocialLinks: 'Linki społecznościowe',"
)

content = content.replace(
    "    creatingPost: 'Publikowanie...',",
    "    creatingPost: 'Publikowanie...',\n    postCreationError: 'Błąd tworzenia posta',"
)

content = content.replace(
    "    commenting: 'Komentowanie...',",
    "    commenting: 'Komentowanie...',\n    commentCreationError: 'Błąd dodawania komentarza',"
)

content = content.replace(
    "    deletePostSuccess: 'Post został usunięty.',",
    "    deletePostSuccess: 'Post został usunięty.',\n    deletePostError: 'Błąd usuwania posta',"
)

content = content.replace(
    "    deleteCommentSuccess: 'Komentarz został usunięty.',",
    "    deleteCommentSuccess: 'Komentarz został usunięty.',\n    deleteCommentError: 'Błąd usuwania komentarza',"
)

content = content.replace(
    "    userUpvotedYourComment: '{{username}} polubił(a) Twój komentarz do posta: \"{{postTitle}}\"',",
    """    userUpvotedYourComment: '{{username}} polubił(a) Twój komentarz do posta: \"{{postTitle}}\"',
    notificationsTitle: 'Powiadomienia',
    notificationsDescription: 'Tutaj zobaczysz powiadomienia o aktywności w Twoich postach i komentarzach.',
    notificationVoted: 'Głosowanie',
    notificationCommented: 'Komentarz',
    post: 'post',
    comment: 'komentarz',
    viewContext: 'Zobacz kontekst',"""
)

# For English section
content = content.replace(
    "    editProfileSocialLinksPlaceholder: 'Your profile link',",
    "    editProfileSocialLinksPlaceholder: 'Your profile link',\n    profileSocialLinks: 'Social Links',"
)

content = content.replace(
    "    creatingPost: 'Publishing...',",
    "    creatingPost: 'Publishing...',\n    postCreationError: 'Error creating post',"
)

content = content.replace(
    "    commenting: 'Commenting...',",
    "    commenting: 'Commenting...',\n    commentCreationError: 'Error adding comment',"
)

content = content.replace(
    "    deletePostSuccess: 'Post deleted successfully.',",
    "    deletePostSuccess: 'Post deleted successfully.',\n    deletePostError: 'Error deleting post',"
)

content = content.replace(
    "    deleteCommentSuccess: 'Comment deleted successfully.',",
    "    deleteCommentSuccess: 'Comment deleted successfully.',\n    deleteCommentError: 'Error deleting comment',"
)

content = content.replace(
    "    userUpvotedYourComment: '{{username}} upvoted your comment on: \"{{postTitle}}\"',",
    """    userUpvotedYourComment: '{{username}} upvoted your comment on: \"{{postTitle}}\"',
    notificationsTitle: 'Notifications',
    notificationsDescription: 'Here you will see notifications about activity on your posts and comments.',
    notificationVoted: 'Vote',
    notificationCommented: 'Comment',
    post: 'post',
    comment: 'comment',
    viewContext: 'View context',"""
)

# Write back
with open('src/lib/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
