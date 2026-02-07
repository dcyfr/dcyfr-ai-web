/**
 * Custom Components Example - Building Reusable UI Components
 * 
 * This example demonstrates how to build custom React components
 * following the Shadcn/ui pattern with TypeScript and Tailwind CSS.
 * 
 * Features:
 *   - Type-safe component props with TypeScript
 *   - Variant-based styling (cva pattern)
 *   - Composable components
 *   - Accessible patterns (ARIA attributes)
 *   - Form handling with controlled inputs
 */

'use client';

import React, { useState, forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Alert Component - Contextual Messages
// ============================================================================

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm',
  {
    variants: {
      variant: {
        default: 'bg-gray-50 text-gray-900 border-gray-200',
        destructive: 'bg-red-50 text-red-900 border-red-200',
        success: 'bg-green-50 text-green-900 border-green-200',
        warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
        info: 'bg-blue-50 text-blue-900 border-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AlertProps
  extends ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof alertVariants> {
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, children, dismissible, onDismiss, ...props }, ref) => {
    const [visible, setVisible] = useState(true);

    const handleDismiss = () => {
      setVisible(false);
      onDismiss?.();
    };

    if (!visible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            aria-label="Dismiss alert"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {title && <div className="mb-1 font-medium">{title}</div>}
        
        <div>{children}</div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

// Example usage:
// <Alert variant="success" title="Success" dismissible>
//   Your changes have been saved.
// </Alert>

// ============================================================================
// Avatar Component - User Profile Images
// ============================================================================

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 font-medium text-gray-600',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt: string;
  fallback?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);

    // Generate initials from alt text
    const initials = fallback || alt
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div ref={ref} className={cn(avatarVariants({ size }), className)} {...props}>
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Example usage:
// <Avatar src="/avatar.jpg" alt="John Doe" size="lg" />
// <Avatar alt="Jane Smith" fallback="JS" size="md" />

// ============================================================================
// Progress Component - Loading Indicators
// ============================================================================

const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
  {
    variants: {
      variant: {
        default: '[&>div]:bg-blue-600',
        success: '[&>div]:bg-green-600',
        warning: '[&>div]:bg-yellow-600',
        danger: '[&>div]:bg-red-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ProgressProps
  extends ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof progressVariants> {
  value: number;
  max?: number;
  showLabel?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, variant, value, max = 100, showLabel, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div className="space-y-1">
        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          className={cn(progressVariants({ variant }), className)}
          {...props}
        >
          <div
            className="h-full transition-all duration-300 ease-in-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {showLabel && (
          <div className="text-xs text-gray-600 text-right">
            {value} / {max} ({Math.round(percentage)}%)
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// Example usage:
// <Progress value={45} max={100} variant="success" showLabel />

// ============================================================================
// Tabs Component - Tabbed Navigation
// ============================================================================

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps extends ComponentPropsWithoutRef<'div'> {
  defaultValue: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, onValueChange, children, ...props }, ref) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    const handleTabChange = (value: string) => {
      setActiveTab(value);
      onValueChange?.(value);
    };

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

export interface TabsListProps extends ComponentPropsWithoutRef<'div'> {}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends ComponentPropsWithoutRef<'button'> {
  value: string;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    
    if (!context) {
      throw new Error('TabsTrigger must be used within Tabs');
    }

    const isActive = context.activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        onClick={() => context.setActiveTab(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          isActive
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends ComponentPropsWithoutRef<'div'> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    
    if (!context) {
      throw new Error('TabsContent must be used within Tabs');
    }

    if (context.activeTab !== value) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('mt-2', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

// Example usage:
// <Tabs defaultValue="account">
//   <TabsList>
//     <TabsTrigger value="account">Account</TabsTrigger>
//     <TabsTrigger value="password">Password</TabsTrigger>
//   </TabsList>
//   <TabsContent value="account">Account settings content</TabsContent>
//   <TabsContent value="password">Password settings content</TabsContent>
// </Tabs>

// ============================================================================
// Dialog Component - Modal Dialogs
// ============================================================================

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open: controlledOpen, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

export interface DialogTriggerProps extends ComponentPropsWithoutRef<'button'> {}

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    
    if (!context) {
      throw new Error('DialogTrigger must be used within Dialog');
    }

    return (
      <button
        ref={ref}
        onClick={(e) => {
          context.setOpen(true);
          onClick?.(e);
        }}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DialogTrigger.displayName = 'DialogTrigger';

export interface DialogContentProps extends ComponentPropsWithoutRef<'div'> {}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    
    if (!context) {
      throw new Error('DialogContent must be used within Dialog');
    }

    if (!context.open) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={() => context.setOpen(false)}
      >
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50" />
        
        {/* Dialog */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

DialogContent.displayName = 'DialogContent';

export const DialogHeader: React.FC<ComponentPropsWithoutRef<'div'>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
};

export const DialogTitle: React.FC<ComponentPropsWithoutRef<'h2'>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h2 className={cn('text-lg font-semibold', className)} {...props}>
      {children}
    </h2>
  );
};

export const DialogDescription: React.FC<ComponentPropsWithoutRef<'p'>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p className={cn('text-sm text-gray-600', className)} {...props}>
      {children}
    </p>
  );
};

export const DialogFooter: React.FC<ComponentPropsWithoutRef<'div'>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('mt-6 flex justify-end gap-2', className)} {...props}>
      {children}
    </div>
  );
};

// Example usage:
// <Dialog>
//   <DialogTrigger>Open Dialog</DialogTrigger>
//   <DialogContent>
//     <DialogHeader>
//       <DialogTitle>Confirm Action</DialogTitle>
//       <DialogDescription>Are you sure you want to delete this item?</DialogDescription>
//     </DialogHeader>
//     <DialogFooter>
//       <Button variant="outline">Cancel</Button>
//       <Button variant="destructive">Delete</Button>
//     </DialogFooter>
//   </DialogContent>
// </Dialog>

// ============================================================================
// Complete Example: User Profile Card
// ============================================================================

export const UserProfileCard: React.FC<{
  user: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
    progress: number;
  };
}> = ({ user }) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header with Avatar */}
      <div className="flex items-center gap-4 mb-4">
        <Avatar src={user.avatar} alt={user.name} size="xl" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          <p className="text-xs text-gray-500 mt-1">{user.role}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Profile Completion</div>
        <Progress value={user.progress} max={100} variant="success" showLabel />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity">
        <TabsList className="w-full">
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <Alert variant="info" title="Recent Activity">
            No recent activity to display.
          </Alert>
        </TabsContent>
        
        <TabsContent value="settings">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Edit Profile
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Usage:
// <UserProfileCard user={{
//   name: 'John Doe',
//   email: 'john@example.com',
//   avatar: '/avatar.jpg',
//   role: 'Admin',
//   progress: 75,
// }} />
