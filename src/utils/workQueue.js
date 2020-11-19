/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
/*global performance*/
/*global performance*/
import AnimationStore from '/stores/animation';

import defer from '/utils/defer';
// Helper to distribute work load across animation frames
// Used for splitting out things like parsing lines
// Typical startup involves 75 step invocations leading to
// ~2000 process invocations
var timeSource = performance || Date;
var WorkQueue = {
  taskCount: 0,

  // Process items for up to 30ms (split across all tasks)
  workTimeout: 30,

  // Maintain global list of onComplete handlers that are
  // ready to be fired. If a task queue has completed
  // processing, these should be fired at highest priority,
  // before any more processing of other queues is done.
  // Fired these first prevents other queues starving the
  // time given to onComplete handlers
  completedTasks: [],

  // Params
  // queue: list of items to process
  // process: function to invoke on each item in `queue`
  // onComplete: function called when processing complete
  createTask: function ( queue, process, onComplete, highPriority ) {
    if ( queue.length === 0 ) {
      defer( onComplete );
      return;
    }

    WorkQueue.taskCount++;
    var i = 0, item, now, task, globalTimeout, localTimeout;
    var complete = false;
    var step = function ( state ) {
      // Bail out instantly if we have no time left
      now = timeSource.now();
      globalTimeout = WorkQueue.workTimeout + state.time;
      if ( now > globalTimeout ) { return }

      // If any task is complete, then handle its
      // onComplete before anything else
      // (but do not trigger if we have less than
      // 10ms
      if ( WorkQueue.completedTasks.length > 0 &&
           globalTimeout - now > 10 ) {
        task = WorkQueue.completedTasks.pop();
        AnimationStore.unlisten( task.step );
        WorkQueue.taskCount--;
        task.onComplete();
      }

      // Now process our queue until our time is up
      now = timeSource.now();
      if ( highPriority ) {
        localTimeout = globalTimeout;
      } else {
        localTimeout = WorkQueue.workTimeout / WorkQueue.taskCount + now;
      }

      while ( now < globalTimeout && // Cap all tasks running time
              now < localTimeout && // Cap this task's running time
              ( item = queue[ i++ ] ) ) {
        process( item );
        now = timeSource.now();
      }

      // Once queue is processed, mark this task as completed,
      // but do not call onComplete yet as this can take a while.
      // onComplete will instead be called on the next tick if we
      // have enough time
      if ( i >= queue.length && !complete ) {
        complete = true;
        WorkQueue.completedTasks.unshift( {
          step: step,
          onComplete: onComplete
        } );
      }
    };

    AnimationStore.listen( step );
  }
};

export default WorkQueue;
