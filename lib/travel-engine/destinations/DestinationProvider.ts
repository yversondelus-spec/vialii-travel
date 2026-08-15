import type { DestinationInfo } from '../core/models'

/** Contract for destination/POI information sources (Section 12). */
export interface DestinationProvider {
  readonly id: string
  readonly name: string
  readonly isConfigured: boolean

  searchDestinations(query: string): Promise<DestinationInfo[]>
  getDestination(id: string): Promise<DestinationInfo | null>
}
