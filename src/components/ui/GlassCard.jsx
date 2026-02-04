import { motion } from 'framer-motion';

const GlassCard = ({ children, className = "" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
};
export default GlassCard;