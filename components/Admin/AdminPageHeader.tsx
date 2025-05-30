interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold capitalize text-black dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      {actions && (
        <div className="mt-4 flex items-center space-x-3 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
