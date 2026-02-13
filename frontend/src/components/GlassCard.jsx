const GlassCard = ({ children, className = "", hover = true }) => {
    return (
        <div className={`glass-card p-6 ${className} ${hover ? 'hover:scale-[1.02]' : ''}`}>
            {children}
        </div>
    );
};

export default GlassCard;
