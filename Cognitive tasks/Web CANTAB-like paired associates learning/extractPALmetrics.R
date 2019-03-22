
extract.PAL.metrics <- function(full.path) {
  # Returns a vector of the following metrics:
  # PAL-6 correct on first try
  # PAL-6 total errors
  # PAL-8 correct on first try
  # PAL-8 total errors
  input.data.frame <- read.table(full.path,
                                 header = T,
                                 sep = ',',
                                 quote = '~')
  # Discard practice data
  input.data.frame <- subset(input.data.frame, Trial > 0)
  cols.to.split <- c('TokenStyles',
                     'ReactionTimes',
                     'IndicesOfBoxesContainingTokens',
                     'OrderBoxesOpened',
                     'OrderBoxesTested',
                     'SubjectAnswers')
  for (col.to.split in cols.to.split) {
    input.data.frame[[col.to.split]] <- lapply(input.data.frame[[col.to.split]],
                                        function(x) {
                                          as.numeric(unlist(strsplit(as.character(x), '-')))
                                        })
  }
  input.data.frame$n.tokens <- sapply(input.data.frame$IndicesOfBoxesContainingTokens, length)
  # Metrics to extract:
  # number of correct responses on the first PAL-6 trial
  # number of correct responses on the PAL-8 (if applicable, else NA)
  curr.metrics <- c()
  curr.metric.names <- c()
  for (pal.n in c(6, 8)) {
    curr.data <- subset(input.data.frame, n.tokens == pal.n)
    if (nrow(curr.data) == 0) {
      curr.metrics <- c(curr.metrics,
                        NA, NA)
      curr.metric.names <- c(curr.metric.names,
                             sprintf('PAL%d_n_correct', pal.n), sprintf('PAL%d_total_errors', pal.n))
    } else {
      # Compute number of correct responses on the first try
      n.correct <- c()
      for (trial.idx in which(curr.data$AttemptN == 0)) {
        n.correct <- c(n.correct,
                       with(curr.data[trial.idx, ], sum(unlist(OrderBoxesTested) == unlist(SubjectAnswers))))
      }
      curr.metrics <- c(curr.metrics,
                        mean(n.correct))
      curr.metric.names <- c(curr.metric.names,
                             sprintf('PAL%d_n_correct', pal.n))
      # Compute total errors
      total.errs <- 0
      for (trial.idx in 1:dim(curr.data)[1]) {
        total.errs <- total.errs +
          with(curr.data[trial.idx, ], sum(unlist(OrderBoxesTested) != unlist(SubjectAnswers)))
      }
      curr.metrics <- c(curr.metrics,
                        total.errs)
      curr.metric.names <- c(curr.metric.names,
                             sprintf('PAL%d_total_errors', pal.n))
    }
  }
  # Compute total errors for all trials
  total.errs <- sum(apply(input.data.frame, 1, function(x) {sum(x$OrderBoxesTested != x$SubjectAnswers)}))
  curr.metrics <- c(curr.metrics, total.errs)
  curr.metric.names <- c(curr.metric.names, 'PAL_total_errors')
  names(curr.metrics) <- curr.metric.names
  return(curr.metrics)
}
