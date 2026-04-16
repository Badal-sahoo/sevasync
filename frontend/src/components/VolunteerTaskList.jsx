import VolunteerTaskCard from "./VolunteerTaskCard";
import "./VolunteerTaskList.css";

const VolunteerTaskList = ({ tasks, onTaskUpdated, onTaskActionSuccess }) => {
  return (
    <section className="volunteer-task-list">
      <div className="volunteer-task-list__header">
        <div>
          <p className="volunteer-task-list__eyebrow">Tasks</p>
          <h2 className="volunteer-task-list__title">
            Assigned and Pending Work
          </h2>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="volunteer-task-list__state">
          No active tasks right now.
        </div>
      ) : (
        <div className="volunteer-task-list__grid">
          {tasks.map((task) => (
            <VolunteerTaskCard
              key={task.task_id}
              task={task}
              onTaskUpdated={onTaskUpdated}
              onTaskActionSuccess={onTaskActionSuccess}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default VolunteerTaskList;