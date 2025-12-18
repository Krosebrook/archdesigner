import React from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

/**
 * Staggered animation container for child elements
 * Implements cinema-grade entrance animations
 */
function StaggeredContainer({ 
  children, 
  staggerDelay = 0.1,
  className = ""
}) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
        duration: 0.4
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

StaggeredContainer.propTypes = {
  children: PropTypes.node.isRequired,
  staggerDelay: PropTypes.number,
  className: PropTypes.string
};

export default StaggeredContainer;