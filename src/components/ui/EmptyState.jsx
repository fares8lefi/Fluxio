import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { SPRING_POP, fadeUpItem, staggerContainer } from '@/lib/motion';

/**
 * EmptyState — shown when a list is empty
 * The icon pops in then floats gently: an empty page is a key moment where a
 * touch of life invites the next action instead of feeling broken.
 * @param {LucideIcon} Icon
 * @param {string} title
 * @param {string} description
 * @param {string} [actionLabel]
 * @param {() => void} [onAction]
 */
export function EmptyState({ Icon, title, description, actionLabel, onAction }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={staggerContainer(0.08, 0.1)}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.6 }}
        animate={
          reduce
            ? { opacity: 1, scale: 1 }
            : {
                opacity: 1,
                scale: 1,
                y: [0, -5, 0],
                transition: {
                  opacity: { duration: 0.2 },
                  scale: SPRING_POP,
                  y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                },
              }
        }
        className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"
      >
        <Icon className="size-7" />
      </motion.span>
      <motion.p variants={fadeUpItem} className="font-semibold text-slate-800">
        {title}
      </motion.p>
      <motion.p variants={fadeUpItem} className="mt-1 max-w-xs text-sm text-slate-500">
        {description}
      </motion.p>
      {actionLabel && onAction && (
        <motion.div variants={fadeUpItem}>
          <Button className="mt-6 rounded-xl" onClick={onAction}>
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
