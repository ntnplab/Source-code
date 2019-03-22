
hyphens.to.list <- function(input) {
  out <- list()
  for (i in 1:length(input)) {
    out[[i]] <- as.numeric(
      unlist(
        strsplit(
          as.character(input[i]), split='-'
        )
      )
    )
  }
  return(out)
}

extract.RDS.metrics <- function(full.path) {
  # Returns a vector of the following metrics:
  # Reverse span
  # Weighted proportion correct
  input.data.frame <- read.table(full.path,
                                 header = T,
                                 sep = ',')
  input.data.frame <- input.data.frame[input.data.frame$Trial > 0, ]
  cols.to.process <- c('NumbersShown', 'Input')
  for (column in cols.to.process) {
    input.data.frame[[column]] <- hyphens.to.list(input.data.frame[[column]])
  }
  input.data.frame$cresps <- sapply(input.data.frame$NumbersShown, rev)
  input.data.frame$n.digits <- sapply(input.data.frame$NumbersShown, length)
  input.data.frame$is.correct <- apply(input.data.frame, 1, function(x) {x$n.digits == sum(x$Input == x$cresps & !is.na(x$Input))})
  n.correct <- tapply(input.data.frame$is.correct, input.data.frame$n.digits, sum)
  n.digits <- as.numeric(names(n.correct))
  errors <- n.correct < 3
  if (any(errors)) {
    first.error.idx <- max(which(errors))
    digit.span <- n.digits[first.error.idx] - 1
    if (n.correct[first.error.idx] == 2) {
      digit.span <- digit.span + 0.5
    }
  } else {
    digit.span <- max(n.digits)
  }
  metrics <- digit.span
  metric.names <- 'RDS_digit.span'
  names(metrics) <- metric.names
  return(metrics)
}