export default function EditReportSkeleton() {
  return (
    <>
      <div className="text-center text-3xl mt-20 text-gray-600 animate-pulse">
        Loading...
      </div>

      <div className="edit-report-loading-footer bg-white animate-pulse w-full p-4 px-7 fixed bottom-0 flex items-center justify-between border-t border-gray-300">
        <div className="bg-gray-200 h-10 w-[65px] rounded" />
        <div className="flex items-center gap-7">
          {Array(2)
            .fill(null)
            .map((_, index) => (
              <div key={index} className="bg-gray-200 h-10 w-[65px] rounded" />
            ))}
        </div>
      </div>
    </>
  );
}
