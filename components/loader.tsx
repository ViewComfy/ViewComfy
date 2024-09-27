import "../app/styles.scss";

export function Loader() {
    return (
        <div className="flex items-center justify-center">
            {[...Array(15)].map((_, i) => (
                <div key={i} className={`circ circ-${i + 1}`}></div>
            ))}
        </div>
    )
}