## [v2.3.0](https://github.com/adrai/node-cqrs-domain/compare/v2.2.3...v2.3.0)
- Support for custom conditions before aggregates are locked [#76](https://github.com/adrai/node-cqrs-domain/pull/#76) thanks to [hilkeheremans](https://github.com/hilkeheremans)

## [v2.2.3](https://github.com/adrai/node-cqrs-domain/compare/v2.2.2...v2.2.3)
- update eventstore

## [v2.2.2](https://github.com/adrai/node-cqrs-domain/compare/v2.2.1...v2.2.2)
- redis: added optional heartbeat

## [v2.2.1](https://github.com/adrai/node-cqrs-domain/compare/v2.2.0...v2.2.1)
- update eventstore
- fix version handling for command validation

## [v2.2.0](https://github.com/adrai/node-cqrs-domain/compare/v2.1.5...v2.2.0)
- version property for command validation rules

## [v2.1.5](https://github.com/adrai/node-cqrs-domain/compare/v2.1.4...v2.1.5)
- updated eventstore

## [v2.1.4](https://github.com/adrai/node-cqrs-domain/compare/v2.1.2...v2.1.4)
- introduce skipHistory on aggregate

## [v2.1.2](https://github.com/adrai/node-cqrs-domain/compare/v2.1.1...v2.1.2)
- little optimization for old folder structure in structureLoader

## [v2.1.1](https://github.com/adrai/node-cqrs-domain/compare/v2.1.0...v2.1.1)
- little optimization for structureLoader

## [v2.1.0](https://github.com/adrai/node-cqrs-domain/compare/v2.0.5...v2.1.0)
- fix snapshot mongodb usage (ATTENTION: this could break if you have existing snapshots)

## [v2.0.5](https://github.com/adrai/node-cqrs-domain/compare/v2.0.4...v2.0.5)
- fix for usage without an aggregate name

## [v2.0.4](https://github.com/adrai/node-cqrs-domain/compare/v2.0.3...v2.0.4)
- redis: fix for new redis lib

## [v2.0.3](https://github.com/adrai/node-cqrs-domain/compare/v2.0.2...v2.0.3)
- mongodb: added optional heartbeat

## [v2.0.2](https://github.com/adrai/node-cqrs-domain/compare/v2.0.1...v2.0.2)
- fix initialization of generalContext

## [v2.0.1](https://github.com/adrai/node-cqrs-domain/compare/v2.0.0...v2.0.1)
- fix event check before setting the event to undispatched

## [v2.0.0](https://github.com/adrai/node-cqrs-domain/compare/v1.10.9...v2.0.0)
- IMPORTANT: extending the validator (tv4) is done differently, getTv4() not working anymore
- added migration api: defineEventStreamsToLoad for command to ensure business rules

## [v1.10.9](https://github.com/adrai/node-cqrs-domain/compare/v1.10.8...v1.10.9)
- give possibility to use mongodb with authSource

## [v1.10.8](https://github.com/adrai/node-cqrs-domain/compare/v1.10.7...v1.10.8)
- update eventstore

## [v1.10.7](https://github.com/adrai/node-cqrs-domain/compare/v1.10.6...v1.10.7)
- optimization for `npm link`'ed development

## [v1.10.6](https://github.com/adrai/node-cqrs-domain/compare/v1.10.4...v1.10.6)
- improved a little bit the performance whan applying a lot of history events

## [v1.10.4](https://github.com/adrai/node-cqrs-domain/compare/v1.10.2...v1.10.4)
- catch throwing errors when calling callback

## [v1.10.2](https://github.com/adrai/node-cqrs-domain/compare/v1.10.1...v1.10.2)
- expose warnings during initialization

## [v1.10.1](https://github.com/adrai/node-cqrs-domain/compare/v1.10.0...v1.10.1)
- update eventstore

## [v1.10.0](https://github.com/adrai/node-cqrs-domain/compare/v1.9.0...v1.10.0)
- introduce defineIgnoreSnapshot function on aggregate

## [v1.9.0](https://github.com/adrai/node-cqrs-domain/compare/v1.8.3...v1.9.0)
- added optional command de-duplication

## [v1.8.3](https://github.com/adrai/node-cqrs-domain/compare/v1.8.2...v1.8.3)
- fix calculation of snapshots

## [v1.8.2](https://github.com/adrai/node-cqrs-domain/compare/v1.8.1...v1.8.2)
- added possibility to use real BusinessRuleError object in pre-conditions and business rules

## [v1.8.1](https://github.com/adrai/node-cqrs-domain/compare/v1.8.0...v1.8.1)
- update eventstore and make use of its commitStamp functionality

## [v1.8.0](https://github.com/adrai/node-cqrs-domain/compare/v1.7.3...v1.8.0)
- added more detailed infos for some ValidationErrors

## [v1.7.3](https://github.com/adrai/node-cqrs-domain/compare/v1.7.2...v1.7.3)
- refactored reorderValidationRules

## [v1.7.2](https://github.com/adrai/node-cqrs-domain/compare/v1.7.1...v1.7.2)
- extend apply function to pass version

## [v1.7.1](https://github.com/adrai/node-cqrs-domain/compare/v1.7.0...v1.7.1)
- little fix in structureLoader, general preConditions

## [v1.7.0](https://github.com/adrai/node-cqrs-domain/compare/v1.6.1...v1.7.0)
- added aggregateIdGenerator

## [v1.6.1](https://github.com/adrai/node-cqrs-domain/compare/v1.5.3...v1.6.1)
- added defineAggregateIdGenerator
- update eventstore

## [v1.5.3](https://github.com/adrai/node-cqrs-domain/compare/v1.5.2...v1.5.3)
- update eventstore

## [v1.5.2](https://github.com/adrai/node-cqrs-domain/compare/v1.5.1...v1.5.2)
- made some performance improvements

## [v1.5.1](https://github.com/adrai/node-cqrs-domain/compare/v1.5.0...v1.5.1)
- update eventstore

## [v1.5.0](https://github.com/adrai/node-cqrs-domain/compare/v1.4.10...v1.5.0)
- attach aggregate preConditions to all commands [#28](https://github.com/adrai/node-cqrs-domain/issues/#28)
- fix priority of preConditions

## [v1.4.10](https://github.com/adrai/node-cqrs-domain/compare/v1.4.9...v1.4.10)
- factory methods for event store and aggregate lock [#35](https://github.com/adrai/node-cqrs-domain/pull/#35) thanks to [nizachon](https://github.com/nizachon)

## [v1.4.9](https://github.com/adrai/node-cqrs-domain/compare/v1.4.6...v1.4.9)
- optimize structureParser
- allow setting values on aggregateModel only in event handle function

## [v1.4.6](https://github.com/adrai/node-cqrs-domain/compare/v1.4.5...v1.4.6)
- fix handling when command does not generate any event

## [v1.4.5](https://github.com/adrai/node-cqrs-domain/compare/v1.4.4...v1.4.5)
- update eventstore

## [v1.4.4](https://github.com/adrai/node-cqrs-domain/compare/v1.4.2...v1.4.4)
- fix usage with own db implementation

## [v1.4.2](https://github.com/adrai/node-cqrs-domain/compare/v1.4.1...v1.4.2)
- catch thrown errors in validation workflow

## [v1.4.1](https://github.com/adrai/node-cqrs-domain/compare/v1.4.0...v1.4.1)
- expose error prototypes

## [v1.4.0](https://github.com/adrai/node-cqrs-domain/compare/v1.3.2...v1.4.0)
- added getInfo function

## [v1.3.2](https://github.com/adrai/node-cqrs-domain/compare/v1.3.1...v1.3.2)
- fix snapshot creation call

## [v1.3.1](https://github.com/adrai/node-cqrs-domain/compare/v1.3.0...v1.3.1)
- optimized catching of thrown error in businessRules and preConditions

## [v1.3.0](https://github.com/adrai/node-cqrs-domain/compare/v1.2.10...v1.3.0)
- expose tv4 instance
- IMPORTANT: removed tv4-formats

## [v1.2.10](https://github.com/adrai/node-cqrs-domain/compare/v1.2.8...v1.2.10)
- introduce existing flag in command

## [v1.2.8](https://github.com/adrai/node-cqrs-domain/compare/v1.2.7...v1.2.8)
- update some dependencies

## [v1.2.7](https://github.com/adrai/node-cqrs-domain/compare/v1.2.6...v1.2.7)
- handle case of same aggregateId in different contexts or aggregates

## [v1.2.6](https://github.com/adrai/node-cqrs-domain/compare/v1.2.5...v1.2.6)
- added possibility to define pre-conditions for all commands of an aggregate

## [v1.2.5](https://github.com/adrai/node-cqrs-domain/compare/v1.2.4...v1.2.5)
- update eventstore dependency

## [v1.2.4](https://github.com/adrai/node-cqrs-domain/compare/v1.2.3...v1.2.4)
- address [#27](https://github.com/adrai/node-cqrs-domain/issues/27)

## [v1.2.3](https://github.com/adrai/node-cqrs-domain/compare/v1.2.2...v1.2.3)
- add possibility to define multiple pre-conditions per command

## [v1.2.2](https://github.com/adrai/node-cqrs-domain/compare/v1.2.1...v1.2.2)
- fix pre-conditions

## [v1.2.1](https://github.com/adrai/node-cqrs-domain/compare/v1.2.0...v1.2.1)
- added azure-table support [#25](https://github.com/adrai/node-cqrs-domain/pull/#25) thanks to [sbiaudet](https://github.com/sbiaudet)

## v1.2.0
- introduced pre-conditions

## v1.1.8
- update eventstore dependency

## v1.1.7
- update eventstore dependency

## v1.1.6
- update eventstore dependency

## v1.1.5
- clone command and event payload before passing to handle function

## v1.1.4
- fixes a major bug for concurrent command handling of same aggregate instance

## v1.1.3
- fixes [#22](https://github.com/adrai/node-cqrs-domain/pull/22) thanks to [zauberpony](https://github.com/zauberpony)

## v1.1.2
- optimize structureLoader (case if directory starts with same name)

## v1.1.1
- do not extend the command if no aggregateId is presented

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
