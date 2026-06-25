import VolunteerTaskCard from "./VolunteerTaskCard";

const VolunteerTaskList = ({ tasks, onTaskUpdated, onTaskActionSuccess, onTaskClick }) => {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Tasks</p>
        <h2 className="text-2xl font-extrabold text-[#0a1f5c]">Assigned and Pending Work</h2>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border-[1.5px] border-dashed border-blue-300 bg-blue-50 px-6 py-7 text-center font-semibold leading-7 text-blue-700">
          🎉 You're all caught up!
          <br />
          New tasks will appear here when available.
        </div>
      ) : (
        <div className="grid justify-start gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,340px))]">
          {tasks.map((task) => (
            <VolunteerTaskCard
              key={task.task_id}
              task={task}
              onTaskUpdated={onTaskUpdated}
              onTaskActionSuccess={onTaskActionSuccess}
              onTaskClick={onTaskClick}
              onClick={() => onTaskClick(task.task_id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default VolunteerTaskList;
