import { LogSeverityLevel, logSeverityLevelsDesc } from '../../common';
import { areConfigTagsEmpty, ConfigT, LogInfo, TagsAndSegment } from '../types';


// ===================================================================================

const hasExplicitExlcOrIncl = ( tag: string, configTags: ConfigT['tags'], mode: TagsAndSegment['mode'] ): boolean => (
  configTags.some( orSegment => (
    orSegment.some( andSegment => andSegment.tag === tag && andSegment.mode === mode )
  ) )
);
const isExplicitlyExcluded = ( tag: string, configTags: ConfigT['tags'] ): boolean => (
  hasExplicitExlcOrIncl( tag, configTags, 'excl' )
);

const isExplicitlyIncluded = ( tag: string, configTags: ConfigT['tags'] ): boolean => (
  hasExplicitExlcOrIncl( tag, configTags, 'incl' )
);

const hasAtLeastOneInclude = ( configTags: ConfigT['tags'] ): boolean => (
  configTags.some( orSegment => (
    orSegment.some( andSegment => andSegment.mode === 'incl' )
  ) )
);

/**
 * @returns `false` - filter out this log call, `true` - continue with this call
 */
export const filterByTags = (
  configTags: ConfigT['tags'],
  info: LogInfo,
  ignoreTagsIfGteSeverity?: LogSeverityLevel,
): boolean => {
  /** no configTags - allow logging everything */
  if ( areConfigTagsEmpty( configTags ) ) return true;

  /**
   * let's check if info.Sev is more severe than ignoreTagsIfGteSeverity
   * and if it is => we can return true right away
   */
  if ( ignoreTagsIfGteSeverity !== undefined ) {
    const infoSevIndex = logSeverityLevelsDesc.indexOf( info.Sev );
    const ignoreTagsSevIndex = logSeverityLevelsDesc.indexOf( ignoreTagsIfGteSeverity );

    // if index of severity in info <= than index of severity in
    // ignoreTagsIfGteSeverity => info.Sev is more severe (i.e more
    // dangerous) => don't want to filter it out
    if ( infoSevIndex <= ignoreTagsSevIndex ) return true;
  }

  const { T_incl } = info;

  // if at least one tag is explicitly excluded in configTags =>
  // filter our this log call
  if ( T_incl.some( it => isExplicitlyExcluded( it, configTags ) ) ) return false;

  // if there is no explicit include at all in configTags => also continue
  if ( hasAtLeastOneInclude( configTags ) === false ) return true;

  // no tag is explicitly excluded, and there is at least one
  // explicit include. Now let's check if at least one tag is
  // explicitly included and if there is such tag - continue
  if ( T_incl.some( tag => isExplicitlyIncluded( tag, configTags ) ) ) return true;

  // so there was no tag in this logInfo that is matches included tags
  // in configTags, so we need too filter out this call
  return false;
};
