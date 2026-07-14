import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ChangeTicketPriorityDto } from './dto/change-ticket-priority.dto';
import { ChangeTicketStatusDto } from './dto/change-ticket-status.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketFromLogiflowDto } from './dto/create-ticket-from-logiflow.dto';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';
import { ReprocessDeadLetterDto } from './dto/reprocess-dead-letter.dto';
import { CreateSupportCatalogDto, UpdateSupportCatalogDto } from './dto/support-catalog.dto';
import { TicketActionDto } from './dto/ticket-action.dto';
import { UpdateInternalNoteDto } from './dto/update-internal-note.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('tickets')
  listTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.ticketsService.listTickets({
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search ? { search } : {}),
    });
  }

  @Post('tickets')
  createTicket(@Body() body: CreateTicketDto) {
    return this.ticketsService.createTicket(body);
  }

  @Post('tickets/from-logiflow')
  createFromLogiflow(
    @Body() body: CreateTicketFromLogiflowDto,
    @Headers('x-service-token') serviceToken: string | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    this.assertServiceToken(serviceToken);
    return this.ticketsService.createFromLogiflow(body, idempotencyKey);
  }

  @Get('tickets/:id')
  getTicket(@Param('id') id: string) {
    return this.ticketsService.getTicket(id);
  }

  @Get('tickets/:id/public')
  getPublicTicket(@Param('id') id: string) {
    return this.ticketsService.getPublicTicket(id);
  }

  @Patch('tickets/:id')
  updateTicket(@Param('id') id: string, @Body() body: UpdateTicketDto) {
    return this.ticketsService.updateTicket(id, body);
  }

  @Delete('tickets/:id')
  archiveTicket(@Param('id') id: string, @Body() body: TicketActionDto) {
    return this.ticketsService.archiveTicket(id, { ...body, status: 'CANCELED' });
  }

  @Patch('tickets/:id/status')
  changeStatus(@Param('id') id: string, @Body() body: ChangeTicketStatusDto) {
    return this.ticketsService.changeStatus(id, body);
  }

  @Patch('tickets/:id/priority')
  changePriority(@Param('id') id: string, @Body() body: ChangeTicketPriorityDto) {
    return this.ticketsService.changePriority(id, body);
  }

  @Post('tickets/:id/messages')
  createMessage(@Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.ticketsService.createMessage(id, body);
  }

  @Post('tickets/:id/notes')
  createLegacyNote(@Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.ticketsService.createNote(id, body);
  }

  @Get('tickets/:id/internal-notes')
  listInternalNotes(@Param('id') id: string) {
    return this.ticketsService.listInternalNotes(id);
  }

  @Post('tickets/:id/internal-notes')
  createInternalNote(@Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.ticketsService.createNote(id, body);
  }

  @Patch('tickets/:id/internal-notes/:noteId')
  updateInternalNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() body: UpdateInternalNoteDto,
  ) {
    return this.ticketsService.updateInternalNote(id, noteId, body);
  }

  @Post('tickets/:id/assign')
  assignTicket(@Param('id') id: string, @Body() body: AssignTicketDto) {
    return this.ticketsService.assignTicket(id, body);
  }

  @Delete('tickets/:id/assign')
  unassignTicket(@Param('id') id: string, @Body() body: AssignTicketDto) {
    return this.ticketsService.unassignTicket(id, body);
  }

  @Post('tickets/:id/change-team')
  changeTeam(@Param('id') id: string, @Body() body: AssignTicketDto) {
    return this.ticketsService.changeTeam(id, body);
  }

  @Get('tickets/:id/assignments')
  listAssignments(@Param('id') id: string) {
    return this.ticketsService.listAssignments(id);
  }

  @Get('tickets/:id/attachments')
  listAttachments(@Param('id') id: string) {
    return this.ticketsService.listAttachments(id);
  }

  @Post('tickets/:id/attachments')
  createAttachment(@Param('id') id: string, @Body() body: CreateAttachmentDto) {
    return this.ticketsService.createAttachment(id, body);
  }

  @Get('notifications')
  listNotifications(
    @Query('userId') userId?: string,
    @Query('teamId') teamId?: string,
    @Query('unread') unread?: string,
  ) {
    return this.ticketsService.listNotifications({
      ...(userId ? { userId } : {}),
      ...(teamId ? { teamId } : {}),
      unread: unread === 'true',
    });
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id') id: string) {
    return this.ticketsService.markNotificationRead(id);
  }

  @Get('notification-preferences/:userId')
  getNotificationPreferences(@Param('userId') userId: string) {
    return this.ticketsService.getNotificationPreferences(userId);
  }

  @Patch('notification-preferences/:userId')
  updateNotificationPreferences(@Param('userId') userId: string, @Body() body: UpdateNotificationPreferenceDto) {
    return this.ticketsService.updateNotificationPreferences(userId, body);
  }

  @Get('reports/summary')
  getReportsSummary() {
    return this.ticketsService.getReportsSummary();
  }

  @Get('dead-letter-events')
  listDeadLetterEvents(
    @Headers('x-service-token') serviceToken: string | undefined,
    @Query('correlationId') correlationId?: string,
  ) {
    this.assertServiceToken(serviceToken);
    return this.ticketsService.listDeadLetterEvents({
      ...(correlationId ? { correlationId } : {}),
    });
  }

  @Post('dead-letter-events/:id/reprocess')
  reprocessDeadLetterEvent(
    @Param('id') id: string,
    @Body() body: ReprocessDeadLetterDto,
    @Headers('x-service-token') serviceToken: string | undefined,
  ) {
    this.assertServiceToken(serviceToken);
    return this.ticketsService.reprocessDeadLetterEvent(id, body);
  }

  @Get('teams')
  listTeams() {
    return this.ticketsService.listTeams();
  }

  @Post('teams')
  createTeam(@Body() body: CreateSupportCatalogDto) {
    return this.ticketsService.createTeam(body);
  }

  @Patch('teams/:id')
  updateTeam(@Param('id') id: string, @Body() body: UpdateSupportCatalogDto) {
    return this.ticketsService.updateTeam(id, body);
  }

  @Delete('teams/:id')
  deleteTeam(@Param('id') id: string, @Body() body: UpdateSupportCatalogDto) {
    return this.ticketsService.deleteTeam(id, body);
  }

  @Get('categories')
  listCategories() {
    return this.ticketsService.listCategories();
  }

  @Post('categories')
  createCategory(@Body() body: CreateSupportCatalogDto) {
    return this.ticketsService.createCategory(body);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: UpdateSupportCatalogDto) {
    return this.ticketsService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string, @Body() body: UpdateSupportCatalogDto) {
    return this.ticketsService.deleteCategory(id, body);
  }

  @Get('tags')
  listTags() {
    return this.ticketsService.listTags();
  }

  @Post('tags')
  createTag(@Body() body: CreateSupportCatalogDto) {
    return this.ticketsService.createTag(body);
  }

  @Patch('tags/:id')
  updateTag(@Param('id') id: string, @Body() body: UpdateSupportCatalogDto) {
    return this.ticketsService.updateTag(id, body);
  }

  @Delete('tags/:id')
  deleteTag(@Param('id') id: string, @Body() body: UpdateSupportCatalogDto) {
    return this.ticketsService.deleteTag(id, body);
  }

  private assertServiceToken(serviceToken: string | undefined) {
    const expected = process.env.LOGIDESK_SERVICE_TOKEN;

    if (!expected || serviceToken !== expected) {
      throw new UnauthorizedException({ error: 'Invalid service token.' });
    }
  }
}
