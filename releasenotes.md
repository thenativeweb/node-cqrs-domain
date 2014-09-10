## v1.1.0
- add possibility to define defaultCommandPayload and defaultEventPayload in aggragate
- add additional validation formats for tv4 [#21](https://github.com/adrai/node-cqrs-domain/pull/21) thanks to [zauberpony](https://github.com/zauberpony)

## v1.0.7
- use new version of eventstore

## v1.0.6
- fix for fallback for file and directory names

## v1.0.5
- allow to not pass an event function in defining an event

## v1.0.4
- do not try-catch errors in domain handle

## v1.0.3
- fix some callback arguments of aggregateLock

## v1.0.2
- fix handling of command without command validation
- fix multiple adding of same definition
- remove debug in redis

## v1.0.0
- refactored whole module
- added possibility to define aggregateId, aggregate and context
- generic message structure for commands and events
- command validation changed, now based on [tv4](https://github.com/geraintluff/tv4)
- added a lot of tests
- stabilized everything
- optimized performance
- IMPORTANT: changed API!!!

## v0.8.2
- do not use newer eventstore version

## v0.8.1
- do not use newer viewmodel version

## v0.8.0
- updated node-queue

## v0.7.9
- send commandRejected event with better reason

## v0.7.8
- added optional callback on commandhandler defaultHandle

## v0.7.7
- optimization for npm module naming

## v0.7.6
- updated eventstore

## v0.7.5
- introduce versioned messages and snapshots

## v0.7.4
- fixed naming of handleUndispatchedEvents option

## v0.7.3
- updated eventstore

## v0.7.2
- update dependencies

## v0.7.1
- load sagas always from db

## v0.7.0
- introduced commandLock for distributed domain (handling same aggregate instance on multiple machines)

## v0.6.1
- buffer commands by aggregate id

## v0.6.0
- don't publish in eventstore but publish in domain
- removed flags: publishingInterval, forkEventDispatching
- added handleUpdispatchedEvents flag

## v0.5.3
- fix for async business rules (issue [#13](https://github.com/adrai/node-cqrs-domain/issues/13))

## v0.5.2
- fix commandDispatcher if no commandqueue is used

## v0.5.0
- a complete change of validation rules (see new [rule-validator](https://github.com/adrai/rule-validator))

## v0.4.4
- added disableQueuing flag

## v0.4.3
- strip .js file extensions to enable loading of .coffee scripts too

## v0.4.2
- added forcedQueuing flag

## v0.4.1
- added optional snapshotThreshold on aggregate

## v0.4.0
- asynchronous api for saga

## v0.3.9
- optimized performance a little

## v0.3.8
- updated eventstore package
- optimized initialization
