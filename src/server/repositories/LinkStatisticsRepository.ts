import { injectable } from 'inversify'
import { Op, Sequelize, Transaction } from 'sequelize'
import _ from 'lodash'

import { Url, UrlType } from '../models/url'
import { Clicks, ClicksType } from '../models/statistics/daily'
import { Devices, DevicesType } from '../models/statistics/devices'
import { WeekdayClicks, WeekdayClicksType } from '../models/statistics/weekday'
import { LinkStatisticsInterface } from '../../shared/interfaces/link-statistics'
import { LinkStatisticsRepositoryInterface } from './interfaces/LinkStatisticsRepositoryInterface'
import { getLocalDayGroup } from '../util/time'
import { NotFoundError } from '../util/error'

export type UrlStats = UrlType & {
  DeviceClicks?: DevicesType
  DailyClicks: ClicksType[]
  WeekdayClicks: WeekdayClicksType[]
}

@injectable()
export class LinkStatisticsRepository
  implements LinkStatisticsRepositoryInterface {
  public findByShortUrl: (
    shortUrl: string,
  ) => Promise<LinkStatisticsInterface | null> = async (shortUrl) => {
    const url = await Url.findOne({
      where: { shortUrl },
      include: [
        { model: Devices, as: 'DeviceClicks' },
        {
          model: Clicks,
          as: 'DailyClicks',
          where: {
            date: {
              // To retrieve a range from today, and up to 6 days ago inclusive.
              [Op.between]: [getLocalDayGroup(-6), getLocalDayGroup()],
            },
          },
        },
        {
          model: WeekdayClicks,
          as: 'WeekdayClicks',
        },
      ],
      order: [
        [{ model: Clicks, as: 'DailyClicks' }, 'date', 'ASC'],
        [{ model: WeekdayClicks, as: 'WeekdayClicks' }, 'weekday', 'ASC'],
        [{ model: WeekdayClicks, as: 'WeekdayClicks' }, 'hours', 'ASC'],
      ],
    })
    if (url) {
      const urlStats = url as UrlStats

      const deviceClicks = urlStats.DeviceClicks
        ? _.pick(urlStats.DeviceClicks.toJSON(), [
            'desktop',
            'tablet',
            'mobile',
            'others',
          ])
        : // Fallback if device statistics is never updated.
          { desktop: 0, tablet: 0, mobile: 0, others: 0 }

      const dailyClicks = urlStats.DailyClicks.map((clicks) => {
        return _.pick(clicks, ['date', 'clicks'])
      })

      const weekdayClicks = urlStats.WeekdayClicks.map((clicks) => {
        return _.pick(clicks, ['weekday', 'hours', 'clicks'])
      })

      return {
        deviceClicks,
        dailyClicks,
        weekdayClicks,
      } as LinkStatisticsInterface
    }
    return null
  }

  public incrementClick: (
    shortUrl: string,
    transaction?: Transaction,
  ) => Promise<boolean> = async (shortUrl) => {
    // Disable hooks to avoid tripping the beforeBulkUpdate rejection
    const [affectedRowCount] = await Url.update(
      { clicks: Sequelize.literal('clicks + 1') },
      { where: { shortUrl }, returning: false, hooks: false },
    )
    if (!affectedRowCount) {
      throw new NotFoundError(
        `shortUrl not found in database:\tshortUrl=${shortUrl}`,
      )
    }
    return affectedRowCount > 0
  }
}

export default LinkStatisticsRepository